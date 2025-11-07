"use strict";

/********* External Imports ********/
const { stringToBuffer, bufferToString, encodeBuffer, decodeBuffer, getRandomBytes } = require("./lib");
const { subtle } = require('crypto').webcrypto;

/********* Constants ********/
const PBKDF2_ITERATIONS = 100000; // number of iterations for PBKDF2 algorithm
const PBKDF2_HASH = "SHA-256";
const KEY_LENGTH = 256; // bits for AES/HMAC material
const SALT_LEN = 16; // bytes
const MAX_PASSWORD_LENGTH = 64;   // assumed maximum password length

/********* Helper utilities *********/

function bufferToHex(buf) {
  const b = Buffer.from(buf);
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(dataBuffer) {
  const hash = await subtle.digest("SHA-256", dataBuffer);
  return bufferToHex(hash);
}

/**
 * Import a raw password string into a CryptoKey usable as PBKDF2 input.
 */
async function importPasswordKey(password) {
  const pwBuf = stringToBuffer(password);
  return subtle.importKey(
    "raw",
    pwBuf,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
}

/**
 * Derive a master key (CryptoKey usable for HMAC) via PBKDF2.
 * Returns a raw CryptoKey (HMAC-SHA-256 key) representing the master secret.
 */
async function deriveMasterKey(password, salt) {
  const pwKey = await importPasswordKey(password);
  // derive raw bits
  const derivedBits = await subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH
    },
    pwKey,
    KEY_LENGTH // bits
  );
  // Import derived bits as an HMAC key (this is the master key in-memory)
  const masterKey = await subtle.importKey(
    "raw",
    derivedBits,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return masterKey;
}

/**
 * Compute HMAC(masterKey, labelBytes) and return raw bytes.
 * We'll use that HMAC output as material to import subkeys.
 */
async function computeHmacRaw(masterKey, labelBytes) {
  // subtle.sign with HMAC key returns the HMAC bytes
  const sig = await subtle.sign({ name: "HMAC" }, masterKey, labelBytes);
  return new Uint8Array(sig);
}

/**
 * Derive the two subkeys from the masterKey:
 * - hmacKey: import as HMAC key
 * - encKey: import as AES-GCM key
 *
 * labelHmac and labelEnc are small Uint8Array labels (e.g. "mac" / "enc")
 */
async function deriveSubkeys(masterKey, labelHmacBytes, labelEncBytes) {
  // Compute raw HMAC outputs
  const hmacRaw = await computeHmacRaw(masterKey, labelHmacBytes);
  const encRaw = await computeHmacRaw(masterKey, labelEncBytes);

  // Import for HMAC usage (domain-name MAC)
  const hmacKey = await subtle.importKey(
    "raw",
    hmacRaw,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  // Import for AES-GCM usage (encryption)
  // AES keys expect 128/192/256-bit lengths; derived bytes length is 32 bytes (256 bits)
  const encKey = await subtle.importKey(
    "raw",
    encRaw,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );

  return { hmacKey, encKey };
}
function padToFixedLength(buf) {
  const len = buf.length;
  if (len > MAX_PASSWORD_LENGTH) throw new Error(`plaintext too long (max ${MAX_PASSWORD_LENGTH} bytes)`);
  const padLen = MAX_PASSWORD_LENGTH - len;
  // PKCS#7 style: fill each pad byte with padLen (if padLen === 0 we still add a full block of pad bytes;
  if (padLen === 0) return buf.slice(); // already fixed length
  const out = new Uint8Array(MAX_PASSWORD_LENGTH);
  out.set(buf, 0);
  out.fill(padLen, len); // fill padding region with padLen
  return out;
}
function unpadFromFixedLength(paddedBuf) {
  if (!paddedBuf || paddedBuf.length !== MAX_PASSWORD_LENGTH) {
    throw new Error("invalid padded buffer length");
  }
  const last = paddedBuf[paddedBuf.length - 1];
  if (last === 0 || last > MAX_PASSWORD_LENGTH) {
    // treat as no padding (return full buffer) or treat as invalid
    // safest is to treat as invalid padding
    throw new Error("invalid padding");
  }
  const padLen = last;
  // verify all pad bytes equal padLen
  for (let i = paddedBuf.length - padLen; i < paddedBuf.length; i++) {
    if (paddedBuf[i] !== padLen) throw new Error("invalid padding");
  }
  return paddedBuf.slice(0, paddedBuf.length - padLen);
}


/********* Keychain class *********/

class Keychain {
  constructor() {
    // public, serializable data
    this.data = {
      // salt is stored as base64 string
      salt: null,
      // entries will be stored as an object mapping domain -> { /* metadata / ciphertext */ }
      entries: {}
    };

    // secrets - in-memory only, not serialized
    this.secrets = {
      masterKey: null, // HMAC CryptoKey used as master (not serialized)
      hmacKey: null,   // CryptoKey used for domain MACs (not serialized)
      encKey: null     // CryptoKey used for AES-GCM (not serialized)
    };
  }

  /**
   * Creates an empty keychain with the given password.
   * - generates salt
   * - derives masterKey and subkeys
   */
  static async init(password) {
    if (typeof password !== "string") throw new Error("password must be a string");
    if (password.length > MAX_PASSWORD_LENGTH) throw new Error(`password too long (max ${MAX_PASSWORD_LENGTH})`);

    const kc = new Keychain();

    // generate random salt and store as base64 in data
    const saltBytes = getRandomBytes(SALT_LEN);
    kc.data.salt = encodeBuffer(saltBytes);

    // derive master key and subkeys
    const masterKey = await deriveMasterKey(password, saltBytes);
    const { hmacKey, encKey } = await deriveSubkeys(
      masterKey,
      stringToBuffer("mac"), // label for MAC subkey
      stringToBuffer("enc")  // label for encryption subkey
    );

    // store in-memory secrets (never serialized)
    kc.secrets.masterKey = masterKey;
    kc.secrets.hmacKey = hmacKey;
    kc.secrets.encKey = encKey;

    // empty entries
    kc.data.entries = {};

    return kc;
  }

  /**
   * Load keychain from serialized representation.
   * repr is expected to be JSON string (the first element of dump()) or
   * the same structure — we accept either the JSON object or JSON string.
   *
   * If trustedDataCheck (hex string) is present, verify SHA-256 checksum.
   */
  static async load(password, repr, trustedDataCheck) {
    if (typeof password !== "string") throw new Error("password must be a string");

    // Accept either JSON string or object
    let obj;
    if (typeof repr === "string") obj = JSON.parse(repr);
    else obj = repr;

    // if checksum provided, verify
    if (trustedDataCheck) {
      const jsonStr = (typeof repr === "string") ? repr : JSON.stringify(repr);
      const actualHex = await sha256Hex(stringToBuffer(jsonStr));
      if (actualHex !== trustedDataCheck) {
        throw new Error("Integrity check failed: checksum mismatch");
      }
    }

    // create Keychain and load public data
    const kc = new Keychain();
    kc.data = {
      salt: obj.salt,
      entries: obj.entries || {}
    };

    // Recreate secrets using provided password and stored salt
    const saltBytes = decodeBuffer(kc.data.salt);
    const masterKey = await deriveMasterKey(password, saltBytes);
    const { hmacKey, encKey } = await deriveSubkeys(
      masterKey,
      stringToBuffer("mac"),
      stringToBuffer("enc")
    );

    kc.secrets.masterKey = masterKey;
    kc.secrets.hmacKey = hmacKey;
    kc.secrets.encKey = encKey;

    return kc;
  }

  /**
   * Returns [jsonString, checksumHex]
   * (jsonString contains only public serializable data; secrets are not included)
   */
  async dump() {
    const publicObj = {
      salt: this.data.salt,
      entries: this.data.entries
    };

    const jsonStr = JSON.stringify(publicObj);
    const checksumHex = await sha256Hex(stringToBuffer(jsonStr));
    return [jsonStr, checksumHex];
  }

  /***** KVS methods (left for application logic) *****/
  async get(name) {
    if (typeof name !== "string" || name.length === 0) throw new Error("name must be a non empty string");
    if(!this.secrets || !this.secrets.encKey || !this.secrets.hmacKey) throw new Error("Keychain not initialized properly");

    const entry = this.data.entries[name];
    if (!entry) return null; // not found

    const iv = decodeBuffer(entry.iv);
    const cipherBytes = decodeBuffer(entry.ciphertext);
    const storedMacHex = entry.mac;

    const nameBytes = stringToBuffer(name);
    const macInput = new Uint8Array(nameBytes.length + iv.length + cipherBytes.length);
    macInput.set(nameBytes, 0);
    macInput.set(cipherBytes, nameBytes.length);

    const macSigAB = await subtle.sign(
      { name: "HMAC" },
      this.secrets.hmacKey,
      macInput
    );
    const macSig = new Uint8Array(macSigAB);
    const macHex = bufferToHex(macSig);

    const storedMacBuf = Buffer.from(storedMacHex, "hex");
    const macBuf = Buffer.from(macHex, "hex");
    if (storedMacBuf.length !== macBuf.length || !crypto.timingSafeEqual(storedMacBuf, macBuf)) {
      throw new Error("Integrity check failed: MAC mismatch");
    }
    let plainBuf;
    try {
      const plainAB = await subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        this.secrets.encKey,
        cipherBytes
      );
      plainBuf = new Uint8Array(plainAB);
    } catch (e) {
      throw new Error("Decryption failed: " + e.message);
    }

    const unpadded = unpadFromFixedLength(plainBuf);

    return bufferToString(unpadded);
  }

  async set(name, value) {
    if (typeof name !== "string") throw new Error("name must be a non empty string");
    if(!this.secrets || !this.secrets.encKey || !this.secrets.hmacKey) throw new Error("Keychain not initialized properly");

    let plaintext;
    if (typeof value === "string") {
      plaintext = stringToBuffer(value);
    }else plaintext = JSON.stringify(value);

    const plainBuforig = stringToBuffer(plaintext);

    const paddedPlain = padToFixedLength(plainBuforig);

    const iv = getRandomBytes(12); // AES-GCM standard IV length is 12 bytes

    //encrpypt
    const cipherBuf = await subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      this.secrets.encKey,
      paddedPlain
    );
    const cipherBytes = new Uint8Array(cipherBuf);

    const nameBytes = stringToBuffer(name);
    const macInput = new Uint8Array(nameBytes.length + iv.length + cipherBytes.length);
    macInput.set(nameBytes, 0);
    macInput.set(cipkerBytes, nameBytes.length);

    const macSigAB = await subtle.sign(
      { name: "HMAC" },
      this.secrets.hmacKey,
      macInput
    );
    const macSigBytes = new Uint8Array(macSigAB);
    const macHex = bufferToHex(macSig);

    this.data.entries[name] = {
      iv: encodeBuffer(iv),
      ciphertext: encodeBuffer(cipherBytes),
      mac: macHex,
      createdAt: (new Date()).toISOString()
    };
    return true;
  }

  async remove(name) {
    if (typeof name !== "string") throw new Error("name must be a string");
    if (!this.data.entries[name]) return false;
    delete this.data.entries[name];
    return true;
  }
}

module.exports = { Keychain };

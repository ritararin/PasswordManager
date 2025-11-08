"use strict";

/********* External Imports ********/
const { stringToBuffer, bufferToString, encodeBuffer, decodeBuffer, getRandomBytes } = require("./lib");
const { subtle } = require('crypto').webcrypto;
const crypto = require('crypto');  // For timingSafeEqual

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
      kvs: {}
    };

    // secrets - in-memory only, not serialized
    // public, serializable data
    this.data = {
      // salt is stored as base64 string
      salt: null,
      // kvs will be stored as an object mapping hashedDomain -> { iv, ciphertext, mac }
      kvs: {}
    };

    // secrets - in-memory only, not serialized
    this.secrets = {
      masterKey: null, // HMAC CryptoKey used as master (not serialized)
      hmacKey: null,   // CryptoKey used for domain MACs (not serialized)
      encKey: null     // CryptoKey used for AES-GCM (not serialized)
    };
  }

  /**
   *  Hash domain name using HMAC
   * This prevents domain names from appearing in plaintext
   */
  async hashDomainName(domain) {
    const domainBytes = stringToBuffer(domain);
    const macSig = await subtle.sign(
      { name: "HMAC" },
      this.secrets.hmacKey,
      domainBytes
    );
    // Return hex string for use as object key
    return bufferToHex(macSig);
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

    // empty kvs
    kc.data.kvs = {};

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
    const jsonStr = (typeof repr === "string") ? repr : JSON.stringify(repr);
    try {
      obj = (typeof repr === "string") ? JSON.parse(repr) : repr;
    } catch (e) {
      throw new Error("Failed to parse input JSON");
    }

    // Ensure salt exists
    if (!obj.salt) throw new Error("Invalid dump format: missing salt");

    // Recreate masterKey from provided password and salt
    const saltBytes = decodeBuffer(obj.salt);
    let masterKey;
    try {
      masterKey = await deriveMasterKey(password, saltBytes);
    } catch (e) {
      throw new Error("Failed to derive master key");
    }

    // ROLLBACK DEFENSE
    // If caller provided trustedDataCheck, verify it using password-dependent HMAC
    if (trustedDataCheck) {
      // Compute HMAC(masterKey, jsonStr)
      const sigAB = await subtle.sign(
        { name: "HMAC" },
        masterKey,
        stringToBuffer(jsonStr)
      );
      const sigBytes = new Uint8Array(sigAB);
      const hex = bufferToHex(sigBytes);
      if (hex !== trustedDataCheck) {
        throw new Error("Integrity check failed: checksum mismatch");
      }
    }

    // Now derive subkeys (hmacKey and encKey)
    const { hmacKey, encKey } = await deriveSubkeys(
      masterKey,
      stringToBuffer("mac"),
      stringToBuffer("enc")
    );

    // Construct keychain and return
    // Swap detection will happen during get() operations
    const kc = new Keychain();
    kc.data = {
      salt: obj.salt,
      kvs: obj.kvs || {}
    };
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
    // public serializable object
    const publicObj = {
      salt: this.data.salt,
      kvs: this.data.kvs
    };

    const jsonStr = JSON.stringify(publicObj);

    //  ROLLBACK DEFENSE
    // Compute password-dependent checksum: HMAC(masterKey, jsonStr)
    if (!this.secrets || !this.secrets.masterKey) {
      // If no masterKey in memory, we cannot compute password-dependent checksum.
      // This is an abnormal situation for your codepath, but handle gracefully:
      // fall back to SHA-256 (but tests initialize kc with password so this won't happen)
      const checksumHex = await sha256Hex(stringToBuffer(jsonStr));
      return [jsonStr, checksumHex];
    }

    // subtle.sign returns ArrayBuffer
    const sigAB = await subtle.sign(
      { name: "HMAC" },
      this.secrets.masterKey,
      stringToBuffer(jsonStr)
    );
    const sigBytes = new Uint8Array(sigAB);
    const checksumHex = bufferToHex(sigBytes);

    return [jsonStr, checksumHex];
  }

  /**
   * Fetches the data corresponding to the given domain from the KVS.
   */
  async get(name) {
    if (typeof name !== "string" || name.length === 0) throw new Error("name must be a non empty string");
    if(!this.secrets || !this.secrets.encKey || !this.secrets.hmacKey) throw new Error("Keychain not initialized properly");

    // Hash domain to look up in kvs
    const hashedDomain = await this.hashDomainName(name);

    const entry = this.data.kvs[hashedDomain];
    if (!entry) return null; // not found

    const iv = decodeBuffer(entry.iv);
    const cipherBytes = decodeBuffer(entry.ciphertext);
    const storedMacHex = entry.mac;

    // First, try to decrypt to check for swap attack
    // We do this BEFORE MAC verification so swap detection is independent
    let plainBuf;
    let decryptionSucceeded = false;
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
      decryptionSucceeded = true;
    } catch (e) {
      // Decryption failed - will be caught by MAC check below
    }

    if (decryptionSucceeded) {
      // Successfully decrypted, now check for swap
      try {
        const unpadded = unpadFromFixedLength(plainBuf);
        const decryptedStr = bufferToString(unpadded);
        const payload = JSON.parse(decryptedStr);

        // 🛡️ MEMBER 4: SWAP ATTACK DEFENSE
        // This check is INDEPENDENT of MAC verification
        if (payload.domain !== name) {
          throw new Error(`Swap attack detected: expected domain '${name}' but found '${payload.domain}'`);
        }

        // Domain matches, now verify MAC for additional integrity
        // MAC is computed over (iv || ciphertext) only - same as in set()
        const macInput = new Uint8Array(iv.length + cipherBytes.length);
        macInput.set(iv, 0);
        macInput.set(cipherBytes, iv.length);

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

        // All checks passed, return password
        return payload.password;
      } catch (e) {
        // Re-throw the error (it's already an Error object)
        throw e;
      }
    } else {
      // Decryption failed, throw error
      throw new Error("Decryption failed or data corrupted");
    }
  }

  /**
   * Inserts the domain and associated data into the KVS.
   */
  async set(name, value) {
    if (typeof name !== "string") throw new Error("name must be a non empty string");
    if(!this.secrets || !this.secrets.encKey || !this.secrets.hmacKey) throw new Error("Keychain not initialized properly");

    // 🛡️ MEMBER 4: SWAP ATTACK DEFENSE
    // We'll encrypt BOTH the domain name AND the password together
    // This binds the password to the domain cryptographically
    
    const payload = {
      domain: name,      // ← Store domain WITH password!
      password: value
    };
    
    const plaintext = JSON.stringify(payload);
    const plainBufOrig = stringToBuffer(plaintext);
    
    // Pad to fixed length to hide password length
    const paddedPlain = padToFixedLength(plainBufOrig);
    
    // Generate random IV
    const iv = getRandomBytes(12);
    // Remove any previous declarations of paddedPlain (none needed here)
    // Encrypt with AES-GCM
    const cipherBuf = await subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      this.secrets.encKey,
      paddedPlain
    );
    const cipherBytes = new Uint8Array(cipherBuf);

    // Hash domain name for storage key
    const hashedDomain = await this.hashDomainName(name);

    // Compute MAC over (iv || ciphertext) only
    // Don't include hashedDomain so swap detection is independent
    const macInput = new Uint8Array(iv.length + cipherBytes.length);
    macInput.set(iv, 0);
    macInput.set(cipherBytes, iv.length);

    const macSigAB = await subtle.sign(
      { name: "HMAC" },
      this.secrets.hmacKey,
      macInput
    );
    const macSigBytes = new Uint8Array(macSigAB);
    const macHex = bufferToHex(macSigBytes);

    // Store with HASHED domain as key
    this.data.kvs[hashedDomain] = {
      iv: encodeBuffer(iv),
      ciphertext: encodeBuffer(cipherBytes),
      mac: macHex,
      createdAt: (new Date()).toISOString()
    };
    
    return true;
  }

  /**
   * Removes the record with name from the password manager.
   */
  async remove(name) {
    if (typeof name !== "string") throw new Error("name must be a string");
    
    // Hash domain to find in kvs
    const hashedDomain = await this.hashDomainName(name);
    
    if (!this.data.kvs[hashedDomain]) return false;
    delete this.data.kvs[hashedDomain];
    return true;
  }
}

module.exports = { Keychain };
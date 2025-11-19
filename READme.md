# Secure Password Manager

A cryptographically secure password manager implementation using Web Crypto API.

## Team Members

**Member 1- Rita Palmeris:** Cryptography & Key Management
**Member 2- Alvin Eredi:** Encryption & Storage  
**Member 3- Ian Tuitoek:** Serialization & Integrity
**Member 4- Myra Nyamwanda:** Security & Attack Defenses
**Member 5- Judah Ndivo:** Testing, Integration & Documentation

## Features

 AES-256-GCM encryption for passwords
 PBKDF2 key derivation (100,000 iterations)
 HMAC-based domain hashing for privacy
 Swap attack protection
 Rollback attack protection  
 Password length hiding via padding

## Installation
```bash
npm install
```

## Usage
```javascript
const { Keychain } = require('./password-manager');

// Initialize new keychain
const keychain = await Keychain.init('my-master-password');

// Store a password
await keychain.set('example.com', 'myPassword123');

// Retrieve a password
const password = await keychain.get('example.com');

// Remove a password
await keychain.remove('example.com');

// Save to storage
const [data, checksum] = await keychain.dump();

// Load from storage
const loaded = await Keychain.load('my-master-password', data, checksum);
```

## Testing
```bash
npm test
```

**Test Results:** ✅ 16/16 tests passing

## Security Architecture

### Cryptographic Primitives
- **Key Derivation:** PBKDF2-SHA256 (100,000 iterations)
- **Encryption:** AES-256-GCM (authenticated encryption)
- **Domain Hashing:** HMAC-SHA256
- **Integrity:** Password-dependent HMAC checksums

### Attack Protections

**Swap Attack Defense:**
- Domain names encrypted WITH passwords
- Verification on retrieval detects swapped entries
- Works independently of global checksum

**Rollback Attack Defense:**
- Password-dependent HMAC over entire database
- Prevents attacker from restoring old database states
- Checksum verification during load

**Metadata Privacy:**
- Domain names hashed with HMAC (not stored in plaintext)
- Password lengths hidden via fixed 64-byte padding
- No information leakage about stored websites

## API Reference

### `Keychain.init(password)`
Creates a new keychain instance.

### `Keychain.load(password, repr, trustedDataCheck)`
Loads existing keychain from serialized data.

### `keychain.set(name, value)`
Stores a password for a domain.

### `keychain.get(name)`
Retrieves a password for a domain. Returns `null` if not found.

### `keychain.remove(name)`
Removes a password entry. Returns `true` if removed, `false` if not found.

### `keychain.dump()`
Serializes the keychain. Returns `[representation, checksum]`.

## Project Structure
```
cyber_lab/
├── password-manager.js       # Main implementation
├── lib.js                    # Utility functions
├── test/
│   └── password-manager.test.js  # Test suite
├── package.json              # npm configuration
├── README.md                 # This file
└── SHORT-ANSWERS.md          # Security explanations
```

## License

MIT
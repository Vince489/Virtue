const nacl = require('tweetnacl');
const bs58 = require('bs58');
const Mnemonic = require('./seedPhrase');
const crypto = require('crypto');

// Keypair class to handle crypto key operations
class Keypair {
  constructor(publicKey, secretKey) {
    this.publicKey = publicKey;
    this.privateKey = secretKey;
  }

  // Generate a new keypair
  static generate() {
    try {
      const seedPhrase = Mnemonic.generate();
      const seed = Mnemonic.mnemonicToSeedSync(seedPhrase.seedPhrase).slice(0, 32); // Convert seed phrase to seed
      const { publicKey, secretKey } = nacl.sign.keyPair.fromSeed(seed);
      return {
        seedPhrase: seedPhrase.seedPhrase,
        keypair: new Keypair(bs58.encode(publicKey), bs58.encode(secretKey))
      };
    } catch (error) {
      throw new Error(`Failed to generate key pair: ${error.message}`);
    }
  }

  // Generate a public key   
  // Generate a simple random public key (not related to any curve)
  static generatePublicKey() {
    // Generate a random 32-byte public key using crypto
    const publicKey = crypto.randomBytes(32);
    return bs58.encode(publicKey);  // Encode it in base58 to match the format you're using
  }

  // Generate a keypair from a seed phrase
  static fromSeedPhrase(seedPhrase) {
    try {
      const seed = Mnemonic.mnemonicToSeedSync(seedPhrase).slice(0, 32); // Convert seed phrase to seed
      const { publicKey, secretKey } = nacl.sign.keyPair.fromSeed(seed);
      return new Keypair(bs58.encode(publicKey), bs58.encode(secretKey));
    } catch (error) {
      throw new Error(`Failed to generate keypair from seed phrase: ${error.message}`);
    }
  }

  static sign(message, privateKey) {
    try {
      const messageData = new TextEncoder().encode(message);
      const privateKeyData = bs58.decode(privateKey);
      const signature = nacl.sign.detached(messageData, privateKeyData);
      return bs58.encode(signature);
    } catch (error) {
      throw new Error('Failed to sign message: ' + error.message);
    }
  }

  static verify(message, signature, publicKey) {
    try {
      const messageData = new TextEncoder().encode(message);
      const signatureData = bs58.decode(signature);
      const publicKeyData = bs58.decode(publicKey);
      return nacl.sign.detached.verify(messageData, signatureData, publicKeyData);
    } catch (error) {
      throw new Error('Failed to verify signature: ' + error.message);
    }
  }

  // Encrypt private key using password-derived key
  static async encryptPrivateKey(privateKey, password) {
    const privateKeyData = bs58.decode(privateKey);
    const key = await Keypair.deriveKeyFromPassword(password);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: Keypair.generateIV() },
      key,
      privateKeyData
    );
    return bs58.encode(new Uint8Array(encrypted));
  }

  // Decrypt private key using password-derived key
  static async decryptPrivateKey(encryptedPrivateKey, password) {
    const encryptedData = bs58.decode(encryptedPrivateKey);
    const key = await Keypair.deriveKeyFromPassword(password);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: Keypair.generateIV() }, // Ensure IV is stored or used consistently
      key,
      encryptedData
    );
    return bs58.encode(new Uint8Array(decrypted));
  }

  // Derive an encryption key from the user's password using PBKDF2
  static async deriveKeyFromPassword(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: Keypair.generateSalt(),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Generate random IV for AES encryption
  static generateIV() {
    return crypto.randomBytes(12); // Use crypto.randomBytes for Node.js
  }

  // Generate random salt for PBKDF2
  static generateSalt() {
    return crypto.randomBytes(16); // Use crypto.randomBytes for Node.js
  }
}

module.exports = Keypair;

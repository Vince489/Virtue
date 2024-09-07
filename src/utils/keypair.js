const nacl = require('tweetnacl');
const bs58 = require('bs58');

// Keypair class to handle crypto key operations
class Keypair {
  constructor() {
    try {
      const { publicKey, secretKey } = nacl.sign.keyPair();
      if (!publicKey || !secretKey) {
        throw new Error('Could not generate keypair');
      }
      this.publicKey = bs58.encode(publicKey);
      this.privateKey = bs58.encode(secretKey);
    } catch (error) {
      throw new Error(`Could not generate key pair: ${error.message}`);
    }
  }

  static generate() {
    try {
      return new Keypair();
    } catch (error) {
      throw new Error(`Failed to generate key pair: ${error.message}`);
    }
  }

  static sign(message, privateKey) {
    try {
      const messageData = new TextEncoder().encode(message);
      const privateKeyData = bs58.decode(privateKey);
      const signature = nacl.sign.detached(messageData, privateKeyData);
      if (!signature) {
        throw new Error('Message signing failed');
      }
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
      const isValid = nacl.sign.detached.verify(messageData, signatureData, publicKeyData);
      if (!isValid) {
        throw new Error('Signature verification failed');
      }
      return isValid;
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
    return crypto.getRandomValues(new Uint8Array(12));
  }

  // Generate random salt for PBKDF2
  static generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  // Save data to local storage
  static saveToLocalStorage(key, value) {
    localStorage.setItem(key, value);
  }

  // Retrieve data from local storage
  static getFromLocalStorage(key) {
    return localStorage.getItem(key);
  }

  // Clear local storage (on logout)
  static clearLocalStorage() {
    localStorage.clear();
  }
}

module.exports = Keypair;

const crypto = require('crypto');

// Encryption function using AES-256-CBC
function encryptData(data, secret) {
  const iv = crypto.randomBytes(16); // Initialization vector
  const key = crypto.scryptSync(secret, 'salt', 32); // Derive a key from the secret

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Combine the iv with the encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

// Decryption function using AES-256-CBC
function decryptData(ciphertext, secret) {
  const [ivHex, encryptedData] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.scryptSync(secret, 'salt', 32); // Derive the key from the secret

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = { encryptData, decryptData };

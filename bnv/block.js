const crypto = require('crypto');

class Block {
  constructor({ slot, previousHash, transactions, validator, reward }) {
    this.slot = slot;
    this.previousHash = previousHash;
    this.transactions = transactions;
    this.validator = validator;
    this.reward = reward;
    this.timestamp = Date.now();  // Use current timestamp
    this.hash = this.calculateHash();
  }

  // Use the crypto module to calculate the SHA-256 hash
  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.slot +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.validator +
        this.reward
      )
      .digest('hex');  // Return the hash in hexadecimal format
  }
}

module.exports = Block;

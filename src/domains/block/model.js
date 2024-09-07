const mongoose = require('mongoose');
const crypto = require('crypto');

const blockSchema = new mongoose.Schema({
  timeStamp: {
    type: Date,
    default: () => new Date().toISOString(),
  },
  slot: {
    type: Number,
    unique: true,
    index: true,
  },
  hash: {
    type: String,
    unique: true,
  },
  previousHash: {
    type: String,
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
  validator: {
    type: String,
  },
  reward: {
    type: Number,
  },
});

blockSchema.pre('save', function (next) {
  // Create a hash only if it's a new block
  if (!this.isNew) {
    return next();
  }

  // Calculate the hash for the block
  const dataToHash = this.timeStamp + JSON.stringify(this.transactions) + (this.previousHash || '') + this.slot;
  this.hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

  next();
});

const Block = mongoose.model('Block', blockSchema);

module.exports = Block;

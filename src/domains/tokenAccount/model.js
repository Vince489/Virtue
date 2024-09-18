const mongoose = require('mongoose');
const Token = require('./token');  // Adjust the path as needed

const tokenDetailSchema = new mongoose.Schema({
  token: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
});

const tokenAccountSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  tokens: [tokenDetailSchema], // Array of token details
  publicKey: {
    type: String,
    required: true,
    unique: true,
  },
  isFrozen: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance improvements
tokenAccountSchema.index({ owner: 1 });

const TokenAccount = mongoose.model('TokenAccount', tokenAccountSchema);

module.exports = TokenAccount;

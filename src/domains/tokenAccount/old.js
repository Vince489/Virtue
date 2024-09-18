const mongoose = require('mongoose');

const tokenAccountSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account', 
    required: true,  // Ensure owner is required
  },
  tokens: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    required: true,    
  }],
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
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
});

// Indexes for performance improvements
tokenAccountSchema.index({ owner: 1 });
tokenAccountSchema.index({ token: 1 });

const TokenAccount = mongoose.model('TokenAccount', tokenAccountSchema);

module.exports = TokenAccount;

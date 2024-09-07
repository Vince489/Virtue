const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  passwordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Password',
    unique: true
  },
  seedPhrase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SeedPhrase',
    unique: true
  },
  publicKey: {
    type: String,
    unique: true
  },
  privateKey: {
    type: String,
    unique: true
  },
  vrtAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VRTAccount',  // Use the exact model name
  },
  tokenAccount: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TokenAccount', 
  }],
  stake: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Stake',
  }],  
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;

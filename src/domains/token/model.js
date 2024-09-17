// token.js
const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  mint: {
    type: String,
    required: true,
    unique: true,
  },
  uri: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    unique: true,
  },
  mintAuthority: {
    type: String,
    required: true,
  },
  freezeAuthority: {
    type: String,
    required: true,
  },
  totalSupply: {
    type: Number,
    default: 0,
  },
  type: {
    type: String,
    default: 'Gaming',
  },
  decimals: {
    type: Number,
    default: 4,
  },
  price: {
    type: Number,
    default: null,
  },
  protocol: {
    type: String,
    default: 'VRC-20',
  },
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;

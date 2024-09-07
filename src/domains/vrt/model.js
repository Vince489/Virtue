const mongoose = require('mongoose');

const VRTSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Virtue', 
    unique: true
  },
  symbol: {
    type: String,
    required: true,
    default: 'VRT', 
    unique: true
  },
  totalSupply: {
    type: Number,
    default: 0 
  },
  circulatingSupply: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    default: 'https://virtualrealitytoken.com/token.img'
  },
  frozen: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    default: 0.01
  },
  decimals: {
    type: Number,
    default: 8,
    required: true
  },
});

const VRT = mongoose.model('VRT', VRTSchema);

module.exports = VRT;


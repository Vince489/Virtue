const mongoose = require('mongoose');

const boutContractSchema = new mongoose.Schema({
  promoters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promoter',
  }],
  boxerAGamerTag: {
    type: String,
    required: true
  },
  boxerAName: {
    type: String,   
    required: true
  },
  boxerAId: {
    type: String,
    required: true
  },
  boxerBGamerTag: {
    type: String,
    required: true
  },
  boxerBName: {
    type: String,   
    required: true
  },
  boxerBId: {
    type: String,
    required: true
  },
  dateOfBout: {
    month: {
      type: Number,
      required: true
    },
    day: {
      type: Number,
      required: true
    },
    year: {
      type: Number,
      required: true
    }
  },
  venueName: {
    type: String,
    default: 'TBD'
  },
  titleBout: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  rounds: {
    type: Number,
    enum: [6, 8, 10, 12],
    required: true
  },
  contractWeight: {
    type: Number,
    required: true
  },
  boxerAPurse: {
    type: Number,
    required: true
  },
  boxerBPurse: {
    type: Number,
    required: true
  },
  fightPurse: {
    type: Number,
    required: true
  },
  rules: {
    type: String,
  },
  bonuses: {
    type: [String],
  },
  promotionalRequirements: {
    type: [String],
  },
  boutStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  boxerASignature: {
    type: String,
  },
  boxerBSignature: {
    type: String,
  },
  promoterSignatures: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  sanctioned: {
    type: Boolean,
    default: false
  },
  commissionSignature: {
    type: String,
  },
  dateSanctioned: {
    type: Date,
  },
});

const BoutContract = mongoose.model('BoutContract', boutContractSchema);

module.exports = BoutContract;
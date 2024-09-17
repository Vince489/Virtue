const mongoose = require('mongoose');

const managerContractSchema = new mongoose.Schema({
  fighter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fighter', // Reference to the registered fighter
    required: true,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager', // Reference to the manager offering the deal
    required: true,
  },
  term: {
    totalFights: {
      type: Number, // Number of fights in the contract (e.g., 6 fights)
      required: true,
    },
    completedFights: {
      type: Number, // Track how many fights the fighter has completed
      default: 0,
    }
  },
  compensation: {
    type: {
      perFightMin: {
        type: Number, // Payment per fight
        required: true,
      },
      bonuses: [{
        type: {
          title: String, // e.g., "KO Bonus"
          amount: Number,
        }
      }],
      managerPercentage: {
        type: Number, // Manager's percentage cut from the fighter’s earnings
        default: 30,  // Default percentage
      },
    },
    required: true,
  },
  obligations: {
    type: [String], // List of fighter’s obligations (e.g., "must fight every two weeks")
  },
  perks: {
    type: [String], // List of perks (e.g., "exclusive sponsorship opportunities")
  },
  terminationClauses: {
    type: [String], // Conditions under which the contract can be terminated
  },
  fighterSignature: {
    type: String, // Signature or verification
  },
  managerSignature: {
    type: String, // Signature or verification
  }, 
  approved: {
    type: Boolean, // Approval status
    default: false
  },
  approvalDate: {
    type: Date, // Date when the contract was approved
    default: null
  },
  commissionId: {
    type: String, 
    default: 'EAC-42781-11-0-000-K' // Default commission ID
  },
  contractDate: {
    type: Date, // Date when the contract was made
    required: true,
    default: Date.now
  },
  status: {
    type: String, // Contract status (e.g., "active", "terminated", "completed")
    default: 'active'
  },
});


const ManagerContract = mongoose.model('Manager Contract', managerContractSchema);

module.exports = ManagerContract;

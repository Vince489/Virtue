class Validator {
  constructor({
    address,
    owner,
    stake,
    index,
    transactions = [],
    active = true
  }) {
    this.address = address; // Unique address of the validator
    this.owner = owner; // Owner of the validator
    this.stake = stake; // The amount staked by the validator
    this.transactions = transactions; // Transactions processed by the validator
    this.active = active; // Whether the validator is currently active
    this.index = index; // The validator's index in the validator set
  }

  // Add a transaction to the validator's processed transactions
  addTransaction(transaction) {
    this.transactions.push(transaction);
  }

  // Mark the validator as inactive
  deactivate() {
    this.active = false;
    console.log(`Validator ${this.address} is now inactive.`);
  }

  // Mark the validator as active
  activate() {
    this.active = true;
    console.log(`Validator ${this.address} is now active.`);
  }

  // Stake more tokens to the validator
  increaseStake(amount) {
    this.stake += amount;
    console.log(`Validator ${this.address} stake increased by ${amount}. Total stake: ${this.stake}.`);
  }

  // Unstake tokens from the validator
  decreaseStake(amount) {
    if (this.stake >= amount) {
      this.stake -= amount;
      console.log(`Validator ${this.address} stake decreased by ${amount}. Total stake: ${this.stake}.`);
    } else {
      console.log(`Insufficient stake to decrease. Validator ${this.address} only has ${this.stake}.`);
    }
  }

  // Broadcast validator information to the network
  broadcastValidatorInfo(p2pNetwork) {
    p2pNetwork.broadcast({
      type: 'VALIDATOR_UPDATE',
      data: this,
    });
    console.log(`Validator ${this.address} info broadcasted to the network.`);
  }

  // Static method to receive a validator from peers
  static receiveValidator(data) {
    return new Validator(data);
  }

  // Static method to initialize a set of validators
  static initializeValidators(validatorsData) {
    return validatorsData.map(data => new Validator(data));
  }
}

module.exports = Validator;

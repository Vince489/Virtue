class Stake {
  constructor({
    staker, 
    address, 
    amount, 
    lockupPeriod = 0, 
    rewards = 0, 
    slashed = false, 
    slashingAmount = 0,
    createdAt = new Date(), 
    updatedAt = new Date()
  }) {
    this.staker = staker; // The account that is staking
    this.address = address; // The address associated with the stake
    this.amount = amount; // The amount staked
    this.lockupPeriod = lockupPeriod; // The lockup period (if any)
    this.rewards = rewards; // Earned rewards
    this.slashed = slashed; // Whether the stake was slashed
    this.slashingAmount = slashingAmount; // Amount slashed (if applicable)
    this.createdAt = createdAt; // Timestamp when the stake was created
    this.updatedAt = updatedAt; // Timestamp of the last update
  }

  // Add rewards to the stake
  addRewards(amount) {
    this.rewards += amount;
    this.updatedAt = new Date();
    console.log(`Rewards of ${amount} added. Total rewards: ${this.rewards}`);
  }

  // Slash the stake (reduce its value due to penalties)
  slash(amount) {
    if (amount > this.amount) {
      console.log('Cannot slash more than the staked amount.');
      return;
    }
    this.amount -= amount;
    this.slashed = true;
    this.slashingAmount += amount;
    this.updatedAt = new Date();
    console.log(`Stake slashed by ${amount}. Remaining amount: ${this.amount}`);
  }

  // Check if the stake is locked (based on the lockup period)
  isLocked(currentDate = new Date()) {
    const unlockDate = new Date(this.createdAt);
    unlockDate.setDate(unlockDate.getDate() + this.lockupPeriod);
    return currentDate < unlockDate;
  }

  // Unlock the stake after the lockup period
  unlock() {
    if (this.isLocked()) {
      console.log('Stake is still locked.');
      return false;
    }
    console.log('Stake is unlocked and can be withdrawn.');
    return true;
  }

  // Update the lockup period
  updateLockupPeriod(newPeriod) {
    this.lockupPeriod = newPeriod;
    this.updatedAt = new Date();
    console.log(`Lockup period updated to ${newPeriod} days.`);
  }

  // Broadcast stake information to the P2P network
  broadcastStakeInfo(p2pNetwork) {
    p2pNetwork.broadcast({
      type: 'STAKE_UPDATE',
      data: this,
    });
    console.log(`Stake info broadcasted for staker: ${this.staker}`);
  }

  // Static method to receive stake data from peers
  static receiveStake(data) {
    return new Stake(data);
  }

  // Static method to initialize stakes from an array of stake data
  static initializeStakes(stakesData) {
    return stakesData.map(data => new Stake(data));
  }
}

module.exports = Stake;

class VRTAccount {
  constructor({ owner, coin, publicKey, balance = 0, isFrozen = false, airdropReceived = false, createdAt = Date.now(), transactions = [] }) {
    this.owner = owner; // Owner of the account (linked to Account class)
    this.coin = coin; // VRT token or coin
    this.publicKey = publicKey; // Unique public key for this account
    this.balance = balance; // Account balance
    this.isFrozen = isFrozen; // Whether the account is frozen
    this.airdropReceived = airdropReceived; // Whether the account has received an airdrop
    this.createdAt = createdAt; // Timestamp when the account was created
    this.transactions = transactions; // Array of transactions associated with the account
  }

  // Create a new VRT Account
  static createVRTAccount(owner, publicKey, coin) {
    return new VRTAccount({
      owner,
      publicKey,
      coin,
      balance: 0,
      isFrozen: false,
      airdropReceived: false,
      createdAt: Date.now(),
      transactions: [],
    });
  }

  // Add a transaction to the account
  addTransaction(transaction) {
    this.transactions.push(transaction);
  }

  // Update balance
  updateBalance(amount) {
    if (!this.isFrozen) {
      this.balance += amount;
    } else {
      console.log('Account is frozen. Balance cannot be updated.');
    }
  }

  // Freeze or unfreeze account
  setFrozenStatus(status) {
    this.isFrozen = status;
  }

  // Mark airdrop as received
  receiveAirdrop() {
    if (!this.airdropReceived) {
      this.airdropReceived = true;
    } else {
      console.log('Airdrop already received.');
    }
  }

  // Broadcast account data to peers
  broadcastAccountData(p2pNetwork) {
    p2pNetwork.broadcast({
      type: 'VRT_ACCOUNT_DATA',
      data: {
        owner: this.owner,
        publicKey: this.publicKey,
        balance: this.balance,
        isFrozen: this.isFrozen,
        transactions: this.transactions,
      },
    });
  }

  // Receive account data from peers
  static receiveAccountData(data) {
    return new VRTAccount(data);
  }
}

module.exports = VRTAccount;

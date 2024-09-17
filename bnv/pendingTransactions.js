class PendingTransaction {
  constructor({
    senderPublicKey,
    recipientPublicKey,
    amount,
    type = 'transfer',
    signature,
    signer = null,
    fee = 0.00,
    confirmations = 0,
    block = null,
    token = null,
  }) {
    this.sender = {
      publicKey: senderPublicKey,
      beginningBalance: 0, // Default value, can be updated based on sender's account
      endingBalance: 0, // Will be calculated after the transaction
    };

    this.recipient = {
      publicKey: recipientPublicKey,
      beginningBalance: 0, // Default value, can be updated based on recipient's account
      endingBalance: 0, // Will be calculated after the transaction
    };

    this.type = type; // Type of the transaction (transfer, stake, etc.)
    this.amount = amount; // Amount being transferred or used in the transaction
    this.signer = signer; // Signer’s account (optional, can be null)
    this.signature = signature; // Digital signature of the transaction
    this.timestamp = new Date().toISOString(); // Timestamp of the transaction
    this.confirmations = confirmations; // Confirmations required before the transaction is finalized
    this.fee = fee; // Transaction fee
    this.complete = false; // Status to track if the transaction is complete
    this.block = block; // Block associated with this transaction (if any)
    this.token = token; // Token associated with this transaction (if applicable)
  }

  // Update sender's beginning balance
  updateSenderBalance(beginningBalance, endingBalance) {
    this.sender.beginningBalance = beginningBalance;
    this.sender.endingBalance = endingBalance;
  }

  // Update recipient's beginning balance
  updateRecipientBalance(beginningBalance, endingBalance) {
    this.recipient.beginningBalance = beginningBalance;
    this.recipient.endingBalance = endingBalance;
  }

  // Mark the transaction as complete
  markComplete() {
    this.complete = true;
  }

  // Confirm the transaction (increment confirmations)
  confirm() {
    this.confirmations += 1;
    console.log(`Transaction confirmed. Confirmations: ${this.confirmations}`);
  }

  // Attach block to the transaction
  attachToBlock(blockId) {
    this.block = blockId;
    console.log(`Transaction attached to block: ${blockId}`);
  }

  // Broadcast the transaction to the P2P network
  broadcastTransaction(p2pNetwork) {
    p2pNetwork.broadcast({
      type: 'PENDING_TRANSACTION',
      data: this,
    });
  }

  // Verify the signature of the transaction
  verifySignature(publicKey, signatureVerifier) {
    return signatureVerifier.verify(this.signature, publicKey);
  }

  // Static method to receive a transaction from peers
  static receiveTransaction(data) {
    return new PendingTransaction(data);
  }
}

module.exports = PendingTransaction;

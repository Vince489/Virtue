const Block = require('./block');

class Blockchain {
  constructor(name) {
    this.name = name;
    this.blocks = [];
    this.epoch = 0;
    this.consensusRules = {};  // Define rules based on your consensus mechanism
    this.currentNodeUrl = currentNodeUrl;  // Store the current node's URL
    this.networkNodes = []; // Store the URLs of other nodes in the network
    this.pendingTransactions = [];  // Store transactions that need to be added to the next block
  

    // Create the genesis block
    this.createGenesisBlock();
  }

  // Create the first block in the blockchain
  createGenesisBlock() {
    const genesisBlock = new Block({
      slot: 0, // Typically, the first block has a slot of 0
      previousHash: null, // Genesis block has no previous hash
      transactions: [], // No transactions in the genesis block
      validator: null, // Placeholder for genesis block validator
      reward: 0, // Set as needed
    });

    genesisBlock.hash = genesisBlock.calculateHash();  // Calculate hash for genesis block
    this.blocks.push(genesisBlock);  // Add the genesis block to the chain
  }

  // Get the latest block in the chain
  getLatestBlock() {
    return this.blocks[this.blocks.length - 1];
  }

  // Add a block to the chain
  addBlock(block) {
    // Set the previous block's hash before adding the new block
    block.previousHash = this.getLatestBlock().hash;

    // Recalculate hash of the new block based on updated data
    block.hash = block.calculateHash();

    // Validate the block before adding
    if (this.validateBlock(block)) {
      this.blocks.push(block);
      this.epoch += 1;  // Increment epoch after a block is added
    } else {
      console.log('Invalid block. It was not added to the chain.');
    }
  }

  // Validate a block (simple validation for now, you can expand this)
  validateBlock(block) {
    // Check if the hash of the block is correct
    if (block.hash !== block.calculateHash()) {
      return false;
    }

    // Check if the block's previous hash matches the hash of the last block
    if (block.previousHash !== this.getLatestBlock().hash) {
      return false;
    }

    // Add further validation rules as needed (e.g., based on consensusRules)
    return true;
  }

  // Create a new transaction
  createNewTransaction(transaction) {
    this.pendingTransactions.push(transaction);
  }

  // Add a new transaction to the pending transactions
  addTransaction(transaction) {
    this.pendingTransactions.push(transaction);
  }

    // Proof of History (PoH) for blockchain
  generateProof() {
    // PoH is a way of proving that an event happened at a specific moment in time.
    // This is just a simplified version: you can use hashes to timestamp events.
    const timestamp = Date.now();
    const data = this.blocks.map(block => block.hash).join('') + timestamp;

    // Hash the current state with timestamp to create a proof
    const proof = crypto.createHash('sha256').update(data).digest('hex');

    return proof;
  }

  // Proof of Stake (PoS) for blockchain
  generateValidator() {
    // PoS is a way of selecting a validator to create a new block based on their stake.
    // This is just a simplified version: you can use more complex rules.
    const validators = ['Alice', 'Bob', 'Charlie', 'David'];
    const index = Math.floor(Math.random() * validators.length);

    return validators[index];
  }


}

// Example usage:
const myBlockchain = new Blockchain('MyBlockchain');
const newBlock = new Block({
  slot: 1,
  transactions: ['tx1', 'tx2'],
  validator: 'Alice',
  reward: 10,
});
myBlockchain.addBlock(newBlock);
console.log(myBlockchain.blocks);


module.exports = Blockchain;

class VRT {
  constructor({ name = 'Virtue', symbol = 'VRT', totalSupply = 0, circulatingSupply = 0, balance = 0, icon = 'https://virtualrealitytoken.com/token.img', frozen = false, price = 0.01, decimals = 8 }) {
    this.name = name;  // Name of the native coin
    this.symbol = symbol;  // Coin symbol
    this.totalSupply = totalSupply;  // Total supply of the coin
    this.circulatingSupply = circulatingSupply;  // Amount of coin circulating in the network
    this.balance = balance;  // Balance held in the coin contract
    this.icon = icon;  // Icon or logo for the coin
    this.frozen = frozen;  // Whether the coin is frozen (cannot be transferred or used)
    this.price = price;  // Current price of the coin
    this.decimals = decimals;  // Number of decimal places for the coin
  }

  // Mint new coins (increase total supply)
  mint(amount) {
    this.totalSupply += amount;
    this.balance += amount;  // Add the newly minted coins to the balance
    console.log(`${amount} ${this.symbol} minted. Total Supply: ${this.totalSupply}`);
  }

  // Burn coins (reduce total supply)
  burn(amount) {
    if (this.totalSupply >= amount) {
      this.totalSupply -= amount;
      this.balance -= amount;  // Remove the burned coins from the balance
      console.log(`${amount} ${this.symbol} burned. Total Supply: ${this.totalSupply}`);
    } else {
      console.log('Not enough supply to burn.');
    }
  }

  // Update the circulating supply (e.g., when coins are distributed or destroyed)
  updateCirculatingSupply(amount) {
    this.circulatingSupply += amount;
  }

  // Freeze the coin (stop transfers)
  freeze() {
    this.frozen = true;
    console.log(`${this.symbol} is now frozen.`);
  }

  // Unfreeze the coin
  unfreeze() {
    this.frozen = false;
    console.log(`${this.symbol} is now unfrozen.`);
  }

  // Update the price of the coin
  updatePrice(newPrice) {
    this.price = newPrice;
    console.log(`New price of ${this.symbol}: $${this.price}`);
  }

  // Broadcast coin data to peers
  broadcastCoinData(p2pNetwork) {
    p2pNetwork.broadcast({
      type: 'VRT_COIN_DATA',
      data: {
        name: this.name,
        symbol: this.symbol,
        totalSupply: this.totalSupply,
        circulatingSupply: this.circulatingSupply,
        balance: this.balance,
        price: this.price,
      },
    });
  }

  // Receive coin data from peers
  static receiveCoinData(data) {
    return new VRT(data);
  }
}

module.exports = VRT;

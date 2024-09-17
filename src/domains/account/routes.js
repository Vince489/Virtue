const express = require("express");
const router = express.Router();

const Mnemonic = require("./../../utils/seedPhrase"); 
const Keypair = require("./../../utils/keypair"); 
const Account = require("./model");
const VRTAccount = require("./../vrtAccount/model");
const Password = require("./../password/model");
const VRT = require("./../vrt/model");
const Wallet = require("./../wallet/model");
const NFTAccount = require("./../nftAccount/model");
const TokenAccount = require("./../tokenAccount/model");
const { encryptData } = require("./../../utils/encrypt-decrypt");

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); 

// Use cookie-parser middleware
router.use(cookieParser());

// Create a new account
router.post('/create-account', async (req, res, next) => {
  try {
    // Generate a seed phrase and derive a keypair from it
    const seedPhrase = Mnemonic.generate(); // Generate seed phrase
    const keypair = Keypair.fromSeedPhrase(seedPhrase.seedPhrase);  // Derive keypair from the seed phrase

    // Check for duplicate public key
    const existingAccount = await Account.findOne({ publicKey: keypair.publicKey });
    if (existingAccount) {
      return res.status(400).json({ error: `Public key ${keypair.publicKey} already exists` });
    }

    // Find native coin (VRT) for the user
    const nativeCoin = await VRT.findOne({ symbol: 'VRT' });
    if (!nativeCoin) {
      return res.status(400).json({ error: "Native coin (VRT) not found" });
    }

    // Generate public key for VRTAccount
    const vrtAccountPublickey = Keypair.generatePublicKey();
    if (!vrtAccountPublickey) {
      throw new Error('VRTAccount publicKey is null or undefined');
    }

    // Create the VRTAccount
    const vrtAccount = new VRTAccount({
      publicKey: vrtAccountPublickey,
      coin: nativeCoin._id,
      owner: null,
    });
    await vrtAccount.save();

    // Create the main account without a password
    const newAccount = new Account({
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,  // Store the private key directly; consider security implications
      vrtAccount: vrtAccount._id,
      nftAccount: null,  // Set this as null for now; we'll update it later
      tokenAccounts: [], // Empty array for token accounts
      stake: [],         // Empty array for stakes
    });
    await newAccount.save();

    // Update VRTAccount owner
    vrtAccount.owner = newAccount._id;
    await vrtAccount.save();

    // --- Create the NFTAccount ---
    // Generate public key for NFTAccount
    const nftAccountPublicKey = Keypair.generatePublicKey();

    // Create the NFTAccount
    const nftAccount = new NFTAccount({
      owner: newAccount._id,    // Associate the NFTAccount with the new Account
      publicKey: nftAccountPublicKey,
      nfts: [],                  // Initially empty, can add NFTs later
      transactions: [],         // Empty transactions for now
    });
    await nftAccount.save();

    // Update the main account with the newly created NFTAccount
    newAccount.nftAccount = nftAccount._id;
    await newAccount.save();

    // Respond with account info, including seed phrase and public key
    res.status(201).json({
      message: "Account created successfully",
      account: {
        seedPhrase: seedPhrase.seedPhrase,
        publicKey: newAccount.publicKey
      }
    });

  } catch (error) {
    console.error('Error creating account:', error);  // More detailed error logging
    next(error);
  }
});

// Recover a keypair using a seed phrase
router.post('/recover-keypair', async (req, res, next) => {
  try {
    // Extract seed phrase from the request body
    const { seedPhrase } = req.body;
    if (!seedPhrase) {
      return res.status(400).json({ error: "Seed phrase is required" });
    }

    // Convert seed phrase to lowercase
    const normalizedSeedPhrase = seedPhrase.toLowerCase();

    // Split the seed phrase into words
    const seedPhraseWords = normalizedSeedPhrase.split(/\s+/);

    // Check if seed phrase has exactly 12 words
    if (seedPhraseWords.length !== 12) {
      return res.status(400).json({ error: "Seed phrase must contain exactly 12 words" });
    }

    // Derive keypair from the seed phrase
    const keypair = Keypair.fromSeedPhrase(normalizedSeedPhrase);

    // Respond with keypair info
    res.json({
      message: "Keypair recovered successfully",
      keypair: {
        publicKey: keypair.publicKey,
        privateKey: keypair.privateKey,
      }
    });

  } catch (error) {
    console.error('Error recovering keypair:', error);  // More detailed error logging
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    // Generate seed phrase and derive keypair from it
    const seedPhrase = Mnemonic.generate(); // Generate seed phrase
    const keypair = Keypair.fromSeedPhrase(seedPhrase.seedPhrase);  // Derive keypair from the seed phrase

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Check for duplicate public key
    const existingAccount = await Account.findOne({ publicKey: keypair.publicKey });
    if (existingAccount) {
      return res.status(400).json({ error: `Public key ${keypair.publicKey} already exists` });
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Encrypt the private key before storing it in the database
    const encryptedPrivateKey = encryptData(keypair.privateKey, process.env.SECRET);

    // Create a new Password entry in the DB
    const passwordEntry = new Password({
      hashedPassword: hashedPassword,
    });
    await passwordEntry.save();

    // Find native coin (VRT) for the user
    const nativeCoin = await VRT.findOne({ symbol: 'VRT' });
    if (!nativeCoin) {
      return res.status(400).json({ error: "Native coin (VRT) not found" });
    }

    // Generate public key for VRTAccount
    const vrtAccountPublickey = Keypair.generatePublicKey();
    if (!vrtAccountPublickey) {
      throw new Error('VRTAccount publicKey is null or undefined');
    }

    // Create the VRTAccount
    const vrtAccount = new VRTAccount({
      publicKey: vrtAccountPublickey,
      coin: nativeCoin._id,
      owner: null,  // Owner will be set after Account creation
    });
    await vrtAccount.save();

    // Create the main Account
    const newAccount = new Account({
      publicKey: keypair.publicKey,
      privateKey: encryptedPrivateKey, 
      vrtAccount: vrtAccount._id,
      nftAccount: null,  // Placeholder, will be updated later
      tokenAccounts: [], // Array for multiple TokenAccounts
      stake: [],         // Placeholder for stakes
    });
    await newAccount.save();

    // Update VRTAccount owner
    vrtAccount.owner = newAccount._id;
    await vrtAccount.save();

    // Generate public key for TokenAccount
    const tokenAccountPublickey = Keypair.generatePublicKey();
    if (!tokenAccountPublickey) {
      throw new Error('TokenAccount publicKey is null or undefined');
    }

    // Create the TokenAccount
    const tokenAccount = new TokenAccount({
      owner: newAccount._id,
      tokens: [],  // Initialize with an empty array or actual Token references
      publicKey: tokenAccountPublickey, // Generated public key
    });
    await tokenAccount.save();

    // Update Account with the TokenAccount reference
    newAccount.tokenAccounts.push(tokenAccount._id);
    await newAccount.save();

    // Generate public key for NFTAccount
    const nftAccountPublicKey = Keypair.generatePublicKey();
    if (!nftAccountPublicKey) {
      throw new Error('NFTAccount publicKey is null or undefined');
    }

    // Create the NFTAccount
    const nftAccount = new NFTAccount({
      owner: newAccount._id,
      nfts: [],  // Initialize with an empty array for future NFTs
      publicKey: nftAccountPublicKey,  // Generated public key
    });
    await nftAccount.save();

    // Update Account with the NFTAccount reference
    newAccount.nftAccount = nftAccount._id;
    await newAccount.save();

    // Create a new Wallet document
    const newWallet = new Wallet({
      passwordId: passwordEntry._id,
      account: newAccount._id,
    });
    await newWallet.save();

    // Create JWT with the password document's ID
    const token = jwt.sign({ passwordId: passwordEntry._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send JWT in an HttpOnly cookie
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: false,  // Change to true in production with HTTPS
      sameSite: 'Strict',
      maxAge: 3600000,  // 1 hour
    });

    // Respond with account and wallet info
    res.status(201).json({
      message: "Wallet created successfully",
      account: {
        seedPhrase: seedPhrase.seedPhrase,
        publicKey: newAccount.publicKey,
      }
    });

  } catch (error) {
    console.error('Error creating account and wallet:', error);  // More detailed error logging
    next(error);
  }
});

// Login route
router.post("/login", async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Extract the JWT token from the cookies
    const token = req.cookies.session_token;
    if (!token) {
      console.log("No token found in cookies"); // Debugging line
      return res.status(401).json({ error: "Authentication token is required" });
    }

    // Verify JWT and extract passwordId
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log("Token verification failed", err); // Debugging line
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const passwordId = decoded.passwordId;

    // Retrieve the wallet using passwordId
    const wallet = await Wallet.findOne({ passwordId }).populate("account");
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Retrieve the associated account from the wallet
    const account = wallet.account;
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Retrieve the password document from MongoDB
    const passwordEntry = await Password.findById(passwordId);
    if (!passwordEntry) {
      return res.status(404).json({ error: "Password entry not found" });
    }

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, passwordEntry.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Respond with account details
    res.json({
      message: "Login successful",
      account: {
        publicKey: account.publicKey,
      }
    });

  } catch (error) {
    next(error);
  }
});


module.exports = router;

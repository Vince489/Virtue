router.post('/mint', authenticateToken, async (req, res, next) => {
  const gamer = req.gamer.gamer.gamer;
  console.log(gamer);

  try {
    const { mintAmount } = req.body;

    // Check if the required mintAmount is provided
    if (!mintAmount || isNaN(mintAmount) || mintAmount <= 0) {
      return res.status(400).json({ error: 'Invalid or missing mintAmount.' });
    }

    // Extract the gamer ID from the decoded token
    const gamerId = req.gamer.gamer.gamer._id;

    // Retrieve the token based on the gamer ID
    const token = await Token.findOne({ mintAuthority: gamerId });

    if (!token) {
      return res.status(404).json({ error: 'Token not found for the provided gamer ID.' });
    }

    // Check if the token's mintAuthority matches the gamer ID
    if (token.mintAuthority.toString() !== gamerId.toString()) {
      return res.status(403).json({ error: 'Permission denied. MintAuthority does not match.' });
    }

    // Create a new token account
    const newTokenAccount = new TokenAccount({
      owner: gamerId,
      token: token._id,
      publicKey: gamer.publicKey,
      balance: mintAmount,
    });

    // Save the new token account to the database
    await newTokenAccount.save();

    // Update the token's totalSupply and save
    token.totalSupply += mintAmount;
    await token.save();

    // Associate the new token account with the gamer's account
    await associateTokenAccount(gamer.account, newTokenAccount._id);

    // Respond with success message and updated token information
    res.status(200).json({ message: 'Tokens minted successfully.', token });
  } catch (error) {
    console.error('Error minting tokens:', error.message);
    next(error);
  }
});

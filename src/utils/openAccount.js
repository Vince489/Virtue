const Account = require('../domains/account/model');
const AirdropAccount = require('../domains/airdropAccount/model');

const associateAccountWithUser = async (accountId, userId) => {
  try {
    // Update the gamer's document to associate the account
    const updatedGamer = await User.findByIdAndUpdate(userId, { account: accountId }, { new: true });

    if (!updatedGamer) {
      throw new Error("Gamer not found or failed to update.");
    }
  } catch (error) {
    console.error("Error associating account with gamer:", error.message);
    throw error;
  }
};

const associateTokenAccount = async (walletId, tokenAccountId) => {
  try {
    // Update the gamer's account to associate the tokenAccount
    const updatedWallet = await Account.findByIdAndUpdate(
      accountId,
      { $push: { tokenAccounts: tokenAccountId } },
      { new: true }
    );

    if (!updatedWallet) {
      throw new Error("Gamer not found or failed to update.");
    }
  } catch (error) {
    console.error("Error associating token account with gamer:", error.message);
    throw error;
  }
};

// Associate the vrt account with the gamer's account
const associateVrtAccount = async (walletId, vrtAccountId) => {
  try {
    // Update the gamer's account to associate the vrtAccount
    const updatedWallet = await Wallet.findByIdAndUpdate(
      walletId,
      { $set: { vrtAccount: vrtAccountId } },
      { new: true }
      );

    if (!updatedWallet) {
      throw new Error("Wallet not found or failed to update.");
    }

    return updatedWallet;
  } catch (error) {
    console.error("Error associating vrt account with wallet:", error.message);
    throw error;
  }
}

// Associate the vrt account with the gamer's account
const associateVrtAccountAD = async (accountId, vrtAccountId) => {
  try {
    // Update the gamer's account to associate the vrtAccount
    const updatedWallet = await AirdropAccount.findByIdAndUpdate(
      accountId,
      { $set: { vrtAccount: vrtAccountId } },
      { new: true }
      );

    if (!updatedWallet) {
      throw new Error("User not found or failed to update.");
    }

    return updatedWallet;
  } catch (error) {
    console.error("Error associating vrt account with airdrop account:", error.message);
    throw error;
  }
}




module.exports = {associateAccountWithUser, associateTokenAccount, associateVrtAccount, associateVrtAccountAD};

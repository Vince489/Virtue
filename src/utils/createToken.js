const jwt = require("jsonwebtoken");

const { TOKEN_KEY } = process.env;

const createToken = async (
  tokenData,
  tokenKey = TOKEN_KEY,
) => {
  return jwt.sign(tokenData, tokenKey);
};

module.exports = createToken;

//json web token authentication
const jwt = require('jsonwebtoken');
//env
require('dotenv').config();

/**
 * use JWT to sign a token
 * @param {*} payload an object with user information. e.g user id
 * @param {*} secret secret key in env variable
 * @param {*} opts {expiresIn: 'timelimit'}
 * @returns 
 */
const sign = (payload, secret, opts) => jwt.sign(payload, secret, opts);

/**
 * use JWT to verify a token
 * @param {*} token the token
 * @param {*} secret secret key in env variable
 * @returns 
 */
const verify = (token, secret) => jwt.verify(token, secret);


const authService = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }
  const isBlacklisted = await isTokenBlacklisted(token);
  if (isBlacklisted) {
    return res.status(401).json({ error: "Access denied. Token is blacklisted." });
  }

  try {
    const decoded = verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

module.exports = {
  sign,
  verify,
  authService
}
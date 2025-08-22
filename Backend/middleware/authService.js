// json web token authentication
const jwt = require("jsonwebtoken");
// env
require("dotenv").config();

// blacklist token check
const { isTokenBlacklisted } = require("./cacheService");

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

/**
 * Authentication + Authorization Middleware
 * @param {boolean} idLock optional flag to check user can only access own id, admin can bypass
 * @param {Array<string>} allowedRoles optional array of roles that are allowed
 * @example
 *   app.get("/admin", authService(["admin"]), (req, res) => {...})
 */
const authService = ( idLock = false, allowedRoles = []) => {
  return async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    // Check blacklist
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res
        .status(401)
        .json({ error: "Access denied. Token is blacklisted." });
    }

    try {
      const decoded = verify(token, process.env.SECRET_KEY);
      req.user = decoded;

      // Role check if roles are provided
      if (
        allowedRoles.length > 0 &&
        (!req.user.role || !allowedRoles.includes(req.user.role))
      ) {
        return res
          .status(403)
          .json({ error: "Forbidden. You do not have access." });
      }
      if(idLock && req.user.id !== Number(req.params.id) && !req.user.role.includes("admin")) {
        return res
          .status(403)
          .json({ error: "Forbidden. You do not have access." });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  };
};

module.exports = {
  sign,
  verify,
  authService,
};

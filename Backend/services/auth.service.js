//import models
const { sequelize, User, RefreshToken } = require("../models");
const { Op } = require("sequelize");

//import dependencies
const bcrypt = require("bcrypt");

//middleware
const { setCacheData, fetchCachedData } = require("../middleware/cacheService");
const { sign, verify } = require("../middleware/authService");

module.exports = {
  //#region verifyEmail
  /**
   * triggered from clicking link in email, verifies user by comparing token with cached
   * @param {*} req query field token required: ?token={token}
   * @param {*} res response
   * @returns
   */
  verifyEmail: async (req, res) => {
    //use transaction to ensure data consistency
    const t = await sequelize.transaction();
    try {
      //get token
      const { token } = req.query;
      if (!token) return res.status(400).send("Missing token");

      //verify token
      const userId = await fetchCachedData(`verify:${token}`);
      if (!userId) {
        return res.status(400).send("Invalid or expired verification token");
      }

      //find user
      const user = await User.findOne(
        { where: { id: userId, is_deleted: false } },
        { transaction: t }
      );
      if (!user) {
        return res.status(404).send("User not found");
      }

      //update user
      await User.update(
        { is_verified: true },
        { where: { id: userId, is_deleted: false }, transaction: t }
      );

      //commit
      await t.commit();

      return res.send("Email verified successfully! You can now log in.");
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        error: "Failed to verify user",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region login
  /**
   * login using email and password in request body, if succesful generate JWT tokens
   * @param {*} req email and password required in request body
   * @param {*} res response
   * @returns an object {accessToken, refreshToken, user}
   */
  login: async (req, res) => {
    try {
      //get body
      const email = req?.body?.email || null;
      const password = req?.body?.password || null;

      console.log(email, password);

      //verify required fields
      if (!email) return res.status(400).json({ error: "email required" });
      if (!password)
        return res.status(400).json({ error: "password required" });

      //verify user / email exists
      const user = await User.findOne({ where: { email, is_deleted: false } });
      if (!user) return res.status(401).json({ error: "invalid credentials" });

      //verify existing user password
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: "invalid credentials" });

      //verify user is verified
      if (!user.is_verified)
        return res
          .status(403)
          .json({ error: "Email not verified. Please check your inbox." });

      // Issue JWT tokens
      const accessToken = sign(
        { id: user.id, role: user.role },
        process.env.SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );
      const refreshToken = sign({ id: user.id }, process.env.SECRET_KEY, {
        expiresIn: "1d",
      });

      //save refresh token
      await RefreshToken.create({
        token: refreshToken,
        user_id: user.id,
        // equation: (now) + (1 day × 24 hours × 60 minutes × 60 seconds × 1000 milliseconds) = 1 day
        expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      });

      //send results
      return res.status(200).json({
        accessToken,
        refreshToken,
        user,
      });
    } catch (err) {
      res.status(500).json({
        error: "Failed to login",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region refreshToken
  /**
   * refreshes access token based on provided refresh token
   * @param {*} req refresh token required from request body
   * @param {*} res receive response
   * @returns new access token
   */
  refreshToken: async (req, res) => {
    try {
      //get refresh token from body
      const { refreshToken } = req.body || {};
      if (!refreshToken) {
        return res.status(400).json({ error: "refreshToken required" });
      }

      //check refresh token exists
      const stored = await RefreshToken.findOne({
        where: { token: refreshToken },
      });
      if (!stored) throw new Error("Refresh token not found");

      //verify refresh token
      const decoded = verify(refreshToken, process.env.SECRET_KEY);
      if (!decoded)
        throw new Error("Expired refresh token, please log in again");
      const user = await User.findOne({
        where: { id: decoded.id, is_deleted: false },
      });
      if (!user) throw new Error("User not found");

      // Issue JWT tokens
      const accessToken = sign(
        { id: user.id, role: user.role },
        process.env.SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );

      //return new access token
      return res.status(200).json({
        accessToken,
      });
    } catch (err) {
      res.status(500).json({
        error: "Failed to refresh tokens",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region logout
  /**
   * logout user by deleting refresh token and blacklisting access token
   * @param {*} req refresh token required from request body, access token required from request header
   * @param {*} res receive response
   * @returns success message
   */
  logout: async (req, res) => {
    try {
      //get refresh token from body
      const { refreshToken } = req.body || {};
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({ error: "Access denied. No token provided." });
      }
      if (!refreshToken) {
        return res.status(400).json({ error: "refreshToken required" });
      }

      //check refresh token exists
      const stored = await RefreshToken.findOne({
        where: { token: refreshToken },
      });
      if (!stored) throw new Error("Refresh token not found");

      //blacklist accessToken
      await setCacheData(`blacklist:${token}`, true, 3600);

      //delete refresh token
      await RefreshToken.destroy({ where: { token: refreshToken } });

      //send results
      return res.status(200).json({ message: "Successfully logged out" });
    } catch (err) {
      res.status(500).json({
        error: "Failed to logout",
        details: err.message,
      });
    }
  },
  //#endregion
};

//Using express routing
const express = require("express");
const router = express.Router();
//controller
const authController = require("../controllers/auth.controller");

//routes endpoint
router.get("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/token/refresh", authController.refreshToken);
router.post("/logout", authController.logout);

module.exports = router;
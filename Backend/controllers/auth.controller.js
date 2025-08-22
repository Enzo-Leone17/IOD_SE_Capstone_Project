//get required service
const authService = require("../services/auth.service");

//expose service functions
module.exports = {
    verifyEmail: async (req, res) => {
        try {
            const verified = await authService.verifyEmail(
                req, res
            );
            res.status(200).json(verified);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    login: async (req, res) => {
        try {
            const user = await authService.login(
                req, res
            );
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    refreshToken: async (req, res) => {
        try {
            const newToken = await authService.refreshToken(
                req, res
            );
            res.status(200).json(newToken);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    logout: async (req, res) => {
        try {
            const user = await authService.logout(req, res);
            res.status(201).json(user);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};
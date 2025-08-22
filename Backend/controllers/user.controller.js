//get required service
const userService = require("../services/user.service");

//expose service functions
module.exports = {
    findAll: async (req, res) => {
        try {
            const users = await userService.findAll(
                req, res
            );
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    findOne: async (req, res) => {
        try {
            const user = await userService.findOne(
                req, res
            );
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    create: async (req, res) => {
        try {
            const newUser = await userService.create(
                req, res
            );
            res.status(200).json(newUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    registerEvent: async (req, res) => {
        try {
            const newRegistration = await userService.registerEvent(req, res);
            res.status(201).json(newRegistration);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    update: async (req, res) => {
        try {
            const updatedUser = await userService.update(req, res);
            res.status(200).json(updatedUser);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    delete: async (req, res) => {
        try {
            const deletedUser = await userService.delete(req, res);
            res.status(200).json(deletedUser);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};
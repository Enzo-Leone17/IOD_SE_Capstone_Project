//get required service
const locationService = require("../services/location.service");

//expose service functions
module.exports = {
    findAll: async (req, res) => {
        try {
            const locations = await locationService.findAll(
                req, res
            );
            res.status(200).json(locations);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    findOne: async (req, res) => {
        try {
            const location = await locationService.findOne(
                req, res
            );
            res.status(200).json(location);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    create: async (req, res) => {
        try {
            const newLocation = await locationService.create(
                req, res
            );
            res.status(200).json(newLocation);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const updatedLocation = await locationService.update(req, res);
            res.status(200).json(updatedLocation);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    delete: async (req, res) => {
        try {
            const deletedLocation = await locationService.delete(req, res);
            res.status(200).json(deletedLocation);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};
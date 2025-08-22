//get required service
const activityService = require("../services/activity.service");

//expose service functions
module.exports = {
    findAll: async (req, res) => {
        try {
            const activities = await activityService.findAll(
                req, res
            );
            res.status(200).json(activities);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    findOne: async (req, res) => {
        try {
            const activity = await activityService.findOne(
                req, res
            );
            res.status(200).json(activity);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    create: async (req, res) => {
        try {
            const newActivity = await activityService.create(
                req, res
            );
            res.status(200).json(newActivity);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const updatedActivity = await activityService.update(req, res);
            res.status(200).json(updatedActivity);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    delete: async (req, res) => {
        try {
            const deletdActivity = await activityService.delete(req, res);
            res.status(200).json(deletdActivity);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};
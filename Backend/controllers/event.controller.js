//get required service
const eventService = require("../services/event.service");

//expose service functions
module.exports = {
    findAll: async (req, res) => {
        try {
            const events = await eventService.findAll(
                req, res
            );
            res.status(200).json(events);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    findOne: async (req, res) => {
        try {
            const event = await eventService.findOne(
                req, res
            );
            res.status(200).json(event);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    create: async (req, res) => {
        try {
            const newEvent = await eventService.create(
                req, res
            );
            res.status(200).json(newEvent);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    findAllRegistrations: async (req, res) => {
        try {
            const registrations = await eventService.findAllRegistrations(req, res);
            res.status(201).json(registrations);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    update: async (req, res) => {
        try {
            const updatedEvent = await eventService.update(req, res);
            res.status(200).json(updatedEvent);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    delete: async (req, res) => {
        try {
            const deletedEvent = await eventService.delete(req, res);
            res.status(200).json(deletedEvent);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};
//get required service
const mediaService = require("../services/media.service");

//expose service functions
module.exports = {
    findAll: async (req, res) => {
        try {
            const medias = await mediaService.findAll(
                req, res
            );
            res.status(200).json(medias);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    findOne: async (req, res) => {
        try {
            const media = await mediaService.findOne(
                req, res
            );
            res.status(200).json(media);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    create: async (req, res) => {
        try {
            const newMedia = await mediaService.create(
                req, res
            );
            res.status(200).json(newMedia);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const updatedMedia = await mediaService.update(req, res);
            res.status(200).json(updatedMedia);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    delete: async (req, res) => {
        try {
            const deletedMedia = await mediaService.delete(req, res);
            res.status(200).json(deletedMedia);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};
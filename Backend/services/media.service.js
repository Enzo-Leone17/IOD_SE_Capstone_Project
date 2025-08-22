//import models
const { sequelize, Media, Activity } = require("../models");
const { Op } = require("sequelize");

//cache middleware
const {
  setCacheData,
  fetchCachedData,
  delPattern,
} = require("../middleware/cacheService");
const activity = require("../models/activity");

module.exports = {
  //#region find all media
  /**
   * Find and return all media with optional query parameters
   * @param {*} req request queries: page, limit, individual parameters[activity_id, type, url], sortBy, sortOrder, search
   * @param {*} res receive response
   */
  findAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      //#region adding filter, sort and search

      //filter
      const filterQuery = {};
      filterQuery.is_deleted = false;

      const validFilter = ["activity_id", "type", "url"];
      for (const key in req.query) {
        if (validFilter.includes(key)) {
          if (key === "type" && !["image", "video"].includes(req.query[key])) {
            return res.status(400).json({ error: "Invalid media type" });
          }
          filterQuery[key] = req.query[key];
        }
      }

      //sort
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder?.toUpperCase();
      const validQuery = ["id", "activity_id", "type", "url"];
      if (sortBy && !validQuery.includes(sortBy)) {
        return res.status(400).json({ error: "Invalid sort field" });
      } else if (sortOrder && !["ASC", "DESC"].includes(sortOrder)) {
        return res.status(400).json({ error: "Invalid sort order" });
      }

      //search
      const search = req.query.search;
      if (search) {
        filterQuery[Op.or] = [
          { activity_id: { [Op.like]: `%${search}%` } },
          { type: { [Op.like]: `%${search}%` } },
        ];
      }

      //#endregion

      // Create a unique cache key based on query params
      const cacheKey = `medias:${JSON.stringify(req.query)}`;

      // Check if cached response exists
      const cached = await fetchCachedData(cacheKey);
      if (cached) {
        console.log("✅ Returning cached result");
        return res.status(200).json(JSON.parse(cached));
      }

      const { count, rows: medias } = await Media.findAndCountAll({
        where: filterQuery,
        include:[
          {
            model: Activity,
            attributes: ["id", "title", "description"],
          }
        ],
        order: [[sortBy ? sortBy : "id", sortOrder ? sortOrder : "ASC"]],
        limit,
        offset,
      });
      const results = {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        medias,
      };

      // Cache the response
      await setCacheData(cacheKey, JSON.stringify(results), 60);

      res.status(200).json(results);
    } catch (err) {
      res.status(500).json({
        error: "Failed to retrieve medias information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region find one media
  /**
   * Find and return a single media based on ID
   * @param {*} req id required in request params, exposed through ":id" in route
   * @param {*} res
   */
  findOne: async (req, res) => {
    try {
      const { id } = req.params;

      //check id valid
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Valid media ID is required" });
      }

      // Create a unique cache key based on query params
      const cacheKey = `medias:id:${JSON.stringify(id)}`;

      // Check if cached response exists
      const cached = await fetchCachedData(cacheKey);
      if (cached) {
        console.log("✅ Returning cached result");
        return res.status(200).json(JSON.parse(cached));
      }

      const media = await Media.findOne({
        where: { id: id, is_deleted: false },
      });
      if (!media) {
        return res.status(404).json({ error: "Media not found" });
      }

      // Cache the response
      await setCacheData(cacheKey, JSON.stringify(media), 60);

      res.status(200).json(media);
    } catch (err) {
      res.status(500).json({
        error: "Failed to retrieve media information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region create media
  /**
   * Create a media
   * @param {*} req activity_id, url and type required in request body
   * @param {*} res receive response
   */
  create: async (req, res) => {
    try {
      //get body parameters
      const activity_id = req?.body?.activity_id || null;
      const type = req?.body?.type || null;
      const url = req?.body?.url || null;

      //required fields
      if (!activity_id) {
        throw new Error("activity_id is required");
      } else if (!type || !["image", "video"].includes(type)) {
        throw new Error("type is required");
      } else if (!url) {
        throw new Error("url is required");
      }

      //create media
      const media = await Media.create({ activity_id, type, url });

      //delete cache
      await delPattern("medias:*");
      await delPattern(`activities:*`);

      res.status(201).json("successfully created media");
    } catch (err) {
      res.status(500).json({
        error: "Failed to create media",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region update media
  /**
   * Update a media by ID
   * @param {*} req id required in request params, exposed through ":id" in route
   * @param {*} res receive response
   */
  update: async (req, res) => {
      try {
        const { id } = req.params;

        //check id valid
        if (!id || isNaN(Number(id))) {
          return res.status(400).json({ error: "Valid media ID is required" });
        }

        //check media exists
        const hasMedia = await Media.findOne({ where: { id: id, is_deleted: false } });
        if (!hasMedia) {
          throw new Error("Media not found");
        }

        //get request body
        const activity_id = req?.body?.activity_id || null;
        const type = req?.body?.type || null;
        const url = req?.body?.url || null;

        //validate type
        if (type && !["image", "video"].includes(type)) {
          throw new Error("Invalid type provided");
        }

        //update media
        await Media.update({ activity_id, type, url }, { where: { id: id } });

        //delete cache
        await delPattern("medias:*");
        await delPattern(`activities:*`);

        res.status(200).json("successfully updated media");
      } catch (err) {
        res.status(500).json({
        error: "Failed to update media information",
        details: err.message,
      });
      }
  },
  //#endregion
  //#region delete media
  /**
   * Delete a media by ID 
   * @param {*} req id required from request params, exposed through ":id" in route
   * @param {*} res receive response
   */
  delete: async (req, res) => {
      try {
        const { id } = req.params;

        //check id valid
        if (!id || isNaN(Number(id))) {
          return res.status(400).json({ error: "Valid media ID is required" });
        }

        //check media exists
        const hasMedia = await Media.findOne({ where: { id: id, is_deleted: false } });
        if (!hasMedia) {
          throw new Error("Media not found");
        }

        //update media
        await Media.update({ is_deleted: true }, { where: { id: id } });

        //delete cache
        await delPattern("medias:*");
        await delPattern(`activities:*`);

        res.status(200).json("successfully deleted media");
      } catch (err) {
        res.status(500).json({
        error: "Failed to remove media",
        details: err.message,
      });
      }
  }
  //#endregion
};

//import models
const { sequelize, Activity, Media, Event_Activity } = require("../models");
const { Op } = require("sequelize");

//cache middleware
const {
  setCacheData,
  fetchCachedData,
  delPattern,
} = require("../middleware/cacheService");

module.exports = {
  //#region find all activities
  /**
   * Find and return all activities with optional query parameters
   * @param {*} req request queries: page, limit, individual parameters[title, description, additional_notes, category], sortBy, sortOrder, search
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

      const validFilter = [
        "title",
        "description",
        "additional_notes",
        "category",
      ];
      for (const key in req.query) {
        if (validFilter.includes(key)) {
          filterQuery[key] = req.query[key];
        }
      }

      //sort
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder?.toUpperCase();
      const validQuery = [
        "id",
        "title",
        "description",
        "additional_notes",
        "category",
      ];
      if (sortBy && validQuery.includes(sortBy)) {
        filterQuery[sortBy] = sortOrder === "ASC" ? "ASC" : "DESC";
      }

      //search
      const search = req.query.search;
      if (search) {
        filterQuery[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { additional_notes: { [Op.like]: `%${search}%` } },
          { category: { [Op.like]: `%${search}%` } },
        ];
      }

      //#endregion

      // Create a unique cache key based on query params
      const cacheKey = `activities:${JSON.stringify(req.query)}`;

      // Check if cached response exists
      const cached = await fetchCachedData(cacheKey);
      if (cached) {
        console.log("✅ Returning cached result");
        return res.status(200).json(JSON.parse(cached));
      }

      const { count, rows: activities } = await Activity.findAll({
        where: filterQuery,
        include: [
          {
            model: Media,
            where: { is_deleted: false },
            required: false,
          },
        ],
        order: [[sortBy ? sortBy : "id", sortOrder ? sortOrder : "ASC"]],
        limit,
        offset,
      });
      const results = {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        activities,
      };

      // Cache the response
      await setCacheData(cacheKey, JSON.stringify(results), 60);

      res.status(200).json(results);
    } catch (err) {
      res.status(500).json({
        error: "Failed to retrieve activities information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region find one activity
  /**
   * Finds a single activity based on ID
   * @param {*} req id required in request params, exposed through ":id" in route
   * @param {*} res receive response
   */
  findOne: async (req, res) => {
    try {
      const { id } = req.params;

      //check id valid
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Valid activity ID is required" });
      }

      // Create a unique cache key based on query params
      const cacheKey = `activities:id:${JSON.stringify(id)}`;

      // Check if cached response exists
      const cached = await fetchCachedData(cacheKey);
      if (cached) {
        console.log("✅ Returning cached result");
        return res.status(200).json(JSON.parse(cached));
      }

      const activity = await Activity.findOne({
        where: { id: id, is_deleted: false },
        include: [
          {
            model: Media,
            where: { is_deleted: false },
            required: false,
          },
        ],
      });
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      // Cache the response
      await setCacheData(cacheKey, JSON.stringify(activity), 60);

      res.status(200).json({
        activity,
      });
    } catch (err) {
      res.status(500).json({
        error: "Failed to retrieve activity information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region create activity
  /**
   * Create a new activity with request body
   * @param {*} req request body parameters [title, description, category(default "other")] required, optional additional_notes
   * @param {*} res receive response
   */
  create: async (req, res) => {
    //get request body
    const title = req?.body?.title || null;
    const description = req?.body?.description || null;
    const category = req?.body?.category || null;
    const additional_notes = req?.body?.additional_notes || null;
    try {
      //required fields
      if (!title) {
        throw new Error("title is required");
      } else if (!description) {
        throw new Error("description is required");
      } else if (
        category &&
        !["sports", "charity", "games", "other"].includes(category)
      ) {
        throw new Error(
          "Valid category [sports, charity, games, other] required"
        );
      }

      //create activity
      const activity = await Activity.create({
        title,
        description,
        category,
        additional_notes,
      });

      //delete cache
      await delPattern("activities:*");

      res.status(200).json({
        message: "Activity created successfully",
        activity,
      });
    } catch (err) {
      res.status(500).json({
        error: "Failed to create activity",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region update activity
  /**
   * Update activity by ID
   * @param {*} req id required in request params, exposed through ":id" in route
   * @param {*} res receive response
   */
  update: async (req, res) => {
    //use transaction to ensure data consistency
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;

      //check id valid
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Valid activity ID is required" });
      }

      //check activity exists
      const hasActivity = await Activity.findOne(
        { where: { id: id, is_deleted: false } },
        { transaction: t }
      );
      if (!hasActivity) {
        throw new Error("Activity not found");
      }

      //get request body
      const title = req?.body?.title || null;
      const description = req?.body?.description || null;
      const category = req?.body?.category || null;
      const additional_notes = req?.body?.additional_notes || null;

      //validate category
      if (
        category &&
        !["sports", "charity", "games", "other"].includes(category)
      ) {
        throw new Error(
          "Valid category [sports, charity, games, other] required"
        );
      }

      //update activity
      await Activity.update(
        {
          title,
          description,
          category,
          additional_notes,
        },
        { where: { id: id }, transaction: t }
      );

      //delete cache
      await delPattern("activities:*");

      await t.commit();
      res.status(200).json({
        message: "Activity updated successfully",
      });
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        error: "Failed to update activity information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region delete activity
  /**
   * Delete activity by ID and update dependencies
   * @param {*} req id required from request params, exposed through ":id" in route
   * @param {*} res receive response
   */
  delete: async (req, res) => {
    //use transaction to ensure data consistency
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;

      //check id valid
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Valid activity ID is required" });
      }

      //check activity exists
      const hasActivity = await Activity.findOne(
        { where: { id: id, is_deleted: false } },
        { transaction: t }
      );
      if (!hasActivity) {
        throw new Error("Activity not found");
      }

      //update activity
      await Activity.update(
        { is_deleted: true },
        { where: { id: id }, transaction: t }
      );

      //update dependencies
      await Event_Activity.destroy(
        { where: { event_id: id } },
        { transaction: t }
      );

      //delete cache
      await delPattern("activities:*");
      await delPattern("events:*");

      await t.commit();
      res.status(200).json("Activity deleted successfully");
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        error: "Failed to delete activity information",
        details: err.message,
      });
    }
  },
  //#endregion
};

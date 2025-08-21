//import models
const {
  sequelize,
  Location,
  Event,
  Event_Activity,
  Registration,
} = require("../models");
const { Op } = require("sequelize");

//cache middleware
const {
  setCacheData,
  fetchCachedData,
  delPattern,
} = require("../middleware/cacheService");

//email middleware
const { sendEventCancelledEmail } = require("../middleware/emailService");

module.exports = {
  //#region find all
  /**
   * Find and return all locations with optional query parameters
   * @param {*} req request queries: page, limit, individual parameters[name, address, booking_cost, url], sortBy, sortOrder, search
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

      const validFilter = ["name", "address", "booking_cost", "url"];
      for (const key in req.query) {
        if (validFilter.includes(key)) {
          filterQuery[key] = req.query[key];
        }
      }

      //sort
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder?.toUpperCase();
      const validQuery = ["id", "name", "address", "booking_cost", "url"];
      if (validQuery.includes(sortBy)) {
        filterQuery[sortBy] = sortOrder;
      }

      //search
      const search = req.query.search;
      if (search) {
        filterQuery[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } },
          { booking_cost: { [Op.iLike]: `%${search}%` } },
        ];
      }

      //#endregion

      // Create a unique cache key based on query params
      const cacheKey = `locations:${JSON.stringify(req.query)}`;

      // Check if cached response exists
      const cached = await fetchCachedData(cacheKey);
      if (cached) {
        console.log("✅ Returning cached result");
        return res.status(200).json(JSON.parse(cached));
      }

      const { count, rows: locations } = await Location.findAndCountAll({
        where: filterQuery,
        order: [[sortBy ? sortBy : "id", sortOrder ? sortOrder : "ASC"]],
        limit,
        offset,
      });
      const results = {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        locations,
      };

      // Cache the response
      await setCacheData(cacheKey, JSON.stringify(results), 60);

      res.status(200).json(results);
    } catch (err) {
      res.status(500).json({
        error: "Failed to retrieve locations information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region find one
  /**
   * Finds a single location based on ID with optional query parameters for events tied to location
   * 
   * optional query parameters: page, limit, individual parameters[host_user_id, title, description, date, budget, available_pax, max_capacity, additional_fee], sortBy, sortOrder, search
   * @param {*} req id required in request params, exposed through ":id" in route
   * @param {*} res receive response
   */
  findOne: async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      //#region adding filter, sort and search

      //filter
      const filterQuery = {};
      filterQuery.is_deleted = false;
      filterQuery.location_id = id;

      const validFilter = [
        "host_user_id",
        "title",
        "description",
        "date",
        "budget",
        "available_pax",
        "max_capacity",
        "additional_fee",
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
        "host_user_id",
        "title",
        "description",
        "date",
        "budget",
        "available_pax",
        "max_capacity",
        "additional_fee",
      ];
      if (sortBy && validQuery.includes(sortBy)) {
        filterQuery[sortBy] = sortOrder === "ASC" ? "ASC" : "DESC";
      }

      //search
      const search = req.query.search;
      if (search) {
        filterQuery[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { date: { [Op.iLike]: `%${search}%` } },
          { budget: { [Op.iLike]: `%${search}%` } },
          { available_pax: { [Op.iLike]: `%${search}%` } },
          { max_capacity: { [Op.iLike]: `%${search}%` } },
          { additional_fee: { [Op.iLike]: `%${search}%` } },
        ];
      }

      //#endregion

      // Create a unique cache key based on query params
      const cacheKey = `locations:id:${JSON.stringify(
        id
      )}:queries:${JSON.stringify(req.query)}`;

      // Check if cached response exists
      const cached = await fetchCachedData(cacheKey);
      if (cached) {
        console.log("✅ Returning cached result");
        return res.status(200).json(JSON.parse(cached));
      }

      const location = await Location.findOne({
        where: { id: id, is_deleted: false },
      });
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      const { count, rows: events } = await Event.findAndCountAll({
        where: filterQuery,
        order: [[sortBy ? sortBy : "id", sortOrder ? sortOrder : "ASC"]],
        limit,
        offset,
      });
      const results = {
        location,
        location_events: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit),
          events,
        },
      };

      // Cache the response
      await setCacheData(cacheKey, JSON.stringify(results), 60);

      res.status(200).json(results);
    } catch (err) {
      res.status(500).json({
        error: "Failed to retrieve location information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region create
  /**
   * Create a new location
   * @param {*} req 
   * @param {*} res 
   */
  create: async (req, res) => {
    try {
      //get body parameters
      const name = req?.body?.name || null;
      const address = req?.body?.address || null;
      const booking_cost = req?.body?.booking_cost || null;
      const url = req?.body?.url || null;
      
      //required fields
      if (!name) {
        throw new Error("name is required");
      } else if (!address) {
        throw new Error("address is required");
      } 
      //validate fields
      if(booking_cost && isNaN(Number(booking_cost))){
        throw new Error("Valid booking_cost is required");
      }

      //create location
      const location = await Location.create({
        name,
        address,
        booking_cost,
        url,
      });

      //delete cache
      await delPattern("locations:*");

      res.status(201).json("Location created successfully");
      
    } catch (err) {
      res.status(500).json({
        error: "Failed to create location",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region update
  /**
   * Update a location by ID
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
        return res.status(400).json({ error: "Valid location ID is required" });
      }

      //check location exists
      const hasLocation = await Location.findOne(
        { where: { id: id, is_deleted: false } },
        { transaction: t }
      );
      if (!hasLocation) {
        throw new Error("Location not found");
      }

      //get request body
      const name = req?.body?.name || null;
      const address = req?.body?.address || null;
      const booking_cost = req?.body?.booking_cost || null;
      const url = req?.body?.url || null;
      
      //validate fields
      if(booking_cost && isNaN(Number(booking_cost))){
        throw new Error("Valid booking_cost is required");
      }

      //update location
      await Location.update(
        {
          name,
          address,
          booking_cost,
          url,
        },
        { where: { id: id }, transaction: t }
      );

      //delete cache
      await delPattern("locations:*");

      await t.commit();
      res.status(200).json("Location updated successfully");      
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        error: "Failed to update location",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region delete
  /**
   * Delete (soft delete) a location by ID and remove dependencies
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
        return res.status(400).json({ error: "Valid location ID is required" });
      }

      //check location exists
      const hasLocation = await Location.findOne(
        { where: { id: id, is_deleted: false } },
        { transaction: t }
      );
      if (!hasLocation) {
        throw new Error("Location not found");
      }

      //update location
      await Location.update(
        { is_deleted: true },
        { where: { id: id }, transaction: t }
      );

      //update dependencies
      //find affected events
      const events = await Event.findAll(
        { where: { location_id: id }, transaction: t }
      );

      //set location null for pending update, keeping event and registrations intact
      events.forEach(async (event) => {
        await Event.update(
          { location_id: null },
          { where: { id: event.id }, transaction: t }
        )
      });

      //delete cache
      await delPattern("locations:*");
      await delPattern("events:*");

      await t.commit();
      res.status(200).json("Location deleted successfully");
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        error: "Failed to delete location",
        details: err.message,
      });
    }
  },
  //#endregion
};

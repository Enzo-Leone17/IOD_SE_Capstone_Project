//import models
const {
  sequelize,
  User,
  Event,
  Location,
  Activity,
  Event_Activity,
  Media,
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
  //#region find all events
  /**
   * Find and return all events with optional query parameters
   * @param {*} req page, limit, individual parameters[host_user_id, location_id, title, description, date, budget, available_pax, max_capacity, additional_fee], sortBy, sortOrder, search
   * @param {*} res receive response
   * @returns
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
        "host_user_id",
        "location_id",
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
        "location_id",
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
      const cacheKey = `events:${JSON.stringify(req.query)}`;

      // Check if cached response exists
      const cached = await fetchCachedData(cacheKey);
      if (cached) {
        console.log("✅ Returning cached result");
        return res.status(200).json(JSON.parse(cached));
      }

      //get all events
      const { count, rows: events } = await Event.findAndCountAll({
        where: filterQuery,
        order: [[sortBy ? sortBy : "id", sortOrder ? sortOrder : "ASC"]],
        include: [
          {
            model: Activity,
            where: { is_deleted: false },
            required: false,
            include: [
              {
                model: Media,
                where: { is_deleted: false },
                required: false,
              },
            ],
          },
          {
            model: Location,
            where: { is_deleted: false },
            required: false,
          },
        ],
        limit,
        offset,
      });

      const results = {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        events,
      };

      // Cache the response
      await setCacheData(cacheKey, JSON.stringify(results), 60);

      return res.status(200).json(results);
    } catch (err) {
      res.status(500).json({
        error: "Failed to retrieve events information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region find one event
  /**
   * finds a single event based on ID
   * @param {*} req id required from request params
   * @param {*} res receive response
   */
  findOne: async (req, res) => {
    try {
      const { id } = req.params;

      //check id valid
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Valid event ID is required" });
      }

      // Create a unique cache key based on query params
      const cacheKey = `events:id:${JSON.stringify(id)}`;

      // Check if cached response exists
      const cached = await fetchCachedData(cacheKey);
      if (cached) {
        console.log("✅ Returning cached result");
        return res.status(200).json(JSON.parse(cached));
      }

      const event = await Event.findOne({
        where: { id: id, is_deleted: false },
        include: [
          {
            model: Activity,
            where: { is_deleted: false },
            required: false,
            include: [
              {
                model: Media,
                where: { is_deleted: false },
                required: false,
              },
            ],
          },
          {
            model: Location,
            where: { is_deleted: false },
            required: false,
          },
        ],
      });
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Cache the response
      await setCacheData(cacheKey, JSON.stringify(event), 60);

      return res.status(200).json(event);
    } catch (err) {
      res.status(500).json({
        error: "Failed to retrieve event information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region find all registrations
  /**
   * finds all registrations based on event ID with optional query parameters for filter sort and search
   * @param {*} req id required from request params
   * @param {*} res receive response, event and registrations
   */
  findAllRegistrations: async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      //check id valid
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Valid event ID is required" });
      }

      //check event exists
      const event = await Event.findOne({
        where: { id: id, is_deleted: false },
      });
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      //#region adding filter, sort and search

      //filter
      const filterQuery = {};
      filterQuery.is_deleted = false;
      filterQuery.event_id = id;

      const validFilter = ["user_id", "status"];
      for (const key in req.query) {
        if (validFilter.includes(key)) {
          filterQuery[key] = req.query[key];
        }
      }

      //sort
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder?.toUpperCase();
      const validQuery = ["id", "user_id", "status"];
      if (validQuery.includes(sortBy)) {
        filterQuery.order = [[sortBy, sortOrder ? sortOrder : "ASC"]];
      }

      //search
      const search = req.query.search;
      if (search) {
        filterQuery.where = {
          [Op.or]: [
            { user_id: { [Op.like]: `%${search}%` } },
            { status: { [Op.like]: `%${search}%` } },
          ],
        };
      }

      //#endregion

      // Create a unique cache key based on query params
      const cacheKey = `events:id:${JSON.stringify(
        id
      )}:registrations:${JSON.stringify(filterQuery)}`;

      // Check if cached response exists
      const cached = await fetchCachedData(cacheKey);
      if (cached) {
        console.log("✅ Returning cached result");
        return res.status(200).json(JSON.parse(cached));
      }

      const { count, rows: registrations } = await Registration.findAndCountAll(
        {
          where: filterQuery,
          order: [[sortBy ? sortBy : "id", sortOrder ? sortOrder : "ASC"]],
          limit,
          offset,
        }
      );

      const results = {
        event,
        registered: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit),
          registrations,
        },
      };

      // Cache the response
      await setCacheData(cacheKey, JSON.stringify(results), 60);

      return res.status(200).json(results);
    } catch (err) {
      res.status(500).json({
        error: "Failed to retrieve event-registrations information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region create event
  /**
   * Creates an event
   * @param {*} req host_user_id, title, description, date, budget, location_id, max_capacity, activity_id(array) required from request body. Optional additional_fee
   * @param {*} res receive response
   */
  create: async (req, res) => {
    //use transaction to ensure data consistency
    const t = await sequelize.transaction();

    //get request body
    const host_user_id = req?.body?.host_user_id || null;
    const title = req?.body?.title || null;
    const description = req?.body?.description || null;
    const date = req?.body?.date || null;
    const budget = req?.body?.budget || null;
    const location_id = req?.body?.location_id || null;
    const max_capacity = req?.body?.max_capacity || null;
    const additional_fee = req?.body?.additional_fee || null;
    const activity_id = req?.body?.activity_id || null;
    try {
      //required fields
      if (host_user_id && isNaN(Number(host_user_id))) {
        throw new Error("Valid host_user_id is required");
      } else if (!title) {
        throw new Error("title is required");
      } else if (!description) {
        throw new Error("description is required");
      } else if (!date) {
        throw new Error("date is required");
      } else if (!budget || isNaN(Number(budget))) {
        throw new Error("Valid budget is required");
      } else if (location_id && isNaN(Number(location_id))) {
        throw new Error("Valid location_id is required");
      } else if (!max_capacity || isNaN(Number(max_capacity))) {
        throw new Error("Valid max_capacity is required");
      } else if (!activity_id) {
        throw new Error("activity_id array is required");
      } else if (
        Array.isArray(activity_id) &&
        activity_id.every((item) => typeof item === "number" && !isNaN(item))
      ) {
        throw new Error("Valid activity_id array is required");
      }

      if (additional_fee && isNaN(Number(additional_fee))) {
        throw new Error("Valid additional_fee is required");
      }

      //validate activity exists
      const hasActivities = await Activity.findAll(
        { where: { id: activity_id, is_deleted: false } },
        { transaction: t }
      );

      if (!hasActivities) {
        throw new Error("No valid activities found");
      }

      //create event
      const event = await Event.create(
        {
          host_user_id,
          location_id,
          title,
          description,
          date,
          budget,
          available_pax: max_capacity,
          max_capacity,
          additional_fee,
        },
        { transaction: t }
      );

      //convert activity_ids to array
      const activity_ids = JSON.parse(activity_id);

      //link activity
      activity_ids.forEach(async (activity) => {
        await Event_Activity.create(
          {
            event_id: event.id,
            activity_id: activity,
          },
          { transaction: t }
        );
      });

      //delete cache
      await delPattern("events:*");

      await t.commit();
      return res.status(200).json("Event created successfully");
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        error: "Failed to create event",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region update event
  /**
   * Updates an event based on ID
   * @param {*} req id required from request params. host_user_id, title, description, date, budget, location_id, max_capacity, activity_id(array), additional_fee are optional in request body
   * @param {*} res receive response
   */
  update: async (req, res) => {
    //use transaction to ensure data consistency
    const t = await sequelize.transaction();
    //limit fields
    const properties = Object.keys(req.body);
    const allowedProperties = [
      "host_user_id",
      "title",
      "description",
      "date",
      "budget",
      "location_id",
      "available_pax",
      "max_capacity",
      "additional_fee",
      "activity_id",
    ];
    try {
      const { id } = req.params;

      //required field
      if (!id || isNaN(Number(id))) {
        throw new Error("Valid event ID is required");
      }

      //check event exists
      const hasEvent = await Event.findOne(
        { where: { id: id, is_deleted: false } },
        { transaction: t }
      );
      if (!hasEvent) {
        throw new Error("Event not found");
      }

      //#region check body fields and validate properties
      let matchingProperties = properties.filter((p) =>
        allowedProperties.includes(p)
      );
      if (matchingProperties.length === 0) {
        return res.status(400).json({ error: "No valid properties to update" });
      }
      //create new body for valid fields
      const newBody = {};
      if (
        matchingProperties.includes("host_user_id") &&
        !isNaN(Number(req.body.host_user_id))
      ) {
        newBody.host_user_id = req.body.host_user_id;
      }
      if (
        matchingProperties.includes("location_id") &&
        !isNaN(Number(req.body.location_id))
      ) {
        newBody.location_id = req.body.location_id;
      }
      if (
        matchingProperties.includes("budget") &&
        !isNaN(Number(req.body.budget))
      ) {
        newBody.budget = req.body.budget;
      }
      if (
        matchingProperties.includes("max_capacity") &&
        !isNaN(Number(req.body.max_capacity))
      ) {
        newBody.max_capacity = req.body.max_capacity;
      }
      if (
        matchingProperties.includes("additional_fee") &&
        !isNaN(Number(req.body.additional_fee))
      ) {
        newBody.additional_fee = req.body.additional_fee;
      }
      if (matchingProperties.includes("title")) {
        newBody.title = req.body.title;
      }
      if (matchingProperties.includes("description")) {
        newBody.description = req.body.description;
      }
      if (matchingProperties.includes("date")) {
        newBody.date = req.body.date;
      }
      if (
        matchingProperties.includes("available_pax") &&
        !isNaN(Number(req.body.available_pax))
      ) {
        newBody.available_pax = req.body.available_pax;
      }
      if (
        matchingProperties.includes("activity_id") &&
        Array.isArray(req.body.activity_id) &&
        req.body.activity_id.every(
          (item) => typeof item === "number" && !isNaN(item)
        )
      ) {
        //update event activity, 1: delete event_activity link
        let eventActivities = await Event_Activity.findAll(
          { where: { event_id: id } },
          { transaction: t }
        );
        eventActivities.forEach(async (ea) => {
          if (!req.body.activity_id.includes(ea.activity_id)) {
            await Event_Activity.destroy(
              { where: { event_id: id, activity_id: ea.activity_id } },
              { transaction: t }
            );
          }
        });

        //update event activity, 2: create event_activity link
        eventActivities = await Event_Activity.findAll(
          { where: { event_id: id } },
          { transaction: t }
        );
        req.body.activity_id.forEach(async (activity) => {
          if (!eventActivities.find((ea) => ea.activity_id === activity)) {
            //validate activity exists
            const hasActivity = await Activity.findOne(
              { where: { activity_id: activity, is_deleted: false } },
              { transaction: t }
            );
            if (!hasActivity) {
              throw new Error("Invalid activity found");
            }
            await Event_Activity.create(
              {
                event_id: id,
                activity_id: activity,
              },
              { transaction: t }
            );
          }
        });
      }
      //#endregion

      //update event
      await Event.update(newBody, {
        where: { id: id, is_deleted: false },
        transaction: t,
      });

      const updatedEvent = await User.findOne(
        { where: { id: id, is_deleted: false } },
        { transaction: t }
      );

      //delete cache
      await delPattern(`events:*`);

      await t.commit();
      res.status(200).json(updatedEvent);
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        error: "Failed to update event information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region delete event
  /**
   * Delete (soft delete) event based on ID and remove dependencies
   * @param {*} req id required from request params
   * @param {*} res
   */
  delete: async (req, res) => {
    //use transaction to ensure data consistency
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      //check id valid
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Valid event ID is required" });
      }
      //check event exists
      const event = await Event.findOne(
        { where: { id: id, is_deleted: false } },
        { transaction: t }
      );
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      //update event
      await Event.update(
        { is_deleted: true },
        { where: { id: id }, transaction: t }
      );

      //update dependencies
      await Event_Activity.destroy(
        { where: { event_id: id } },
        { transaction: t }
      );

      //registrations affected
      const affectedRegistrations = await Registration.findAll(
        { where: { event_id: id, status: "scheduled", is_deleted: false } },
        { transaction: t }
      );
      //users affected
      const uniqueUserIDs = new Set(
        affectedRegistrations.map((reg) => reg.user_id)
      );
      const cancellationEmails = [];
      for (const userID of uniqueUserIDs) {
        const user = await User.findOne(
          { where: { id: userID, is_deleted: false } },
          { transaction: t }
        );
        if (user) {
          cancellationEmails.push(user.email);
        }
      }
      //remove affected registrations
      await Registration.update(
        { status: "cancelled", is_deleted: true },
        { where: { event_id: id, status: "scheduled" }, transaction: t }
      );
      //send apology emails
      await sendEventCancelledEmail(cancellationEmails, event);

      //delete cache
      await delPattern(`events:*`);

      await t.commit();
      res.status(200).json({ success: "Event deleted successfully" });
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        error: "Failed to delete event information",
        details: err.message,
      });
    }
  },
  //#endregion
};

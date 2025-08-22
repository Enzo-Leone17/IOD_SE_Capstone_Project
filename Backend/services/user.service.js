//import models
const { sequelize, User, Registration, Event } = require("../models");
const { Op } = require("sequelize");

//use bcrypt for passwords
const bcrypt = require("bcrypt");

//uuid for email verification (auth route), -> frontend url
const { v4: uuid } = require("uuid");

//cache middleware
const {
  setCacheData,
  fetchCachedData,
  delPattern,
} = require("../middleware/cacheService");

//email middleware
const { sendVerificationEmail ,sendEventRegistrationEmail } = require("../middleware/emailService");

module.exports = {
  //#region find all users
  /**
   * Find and return all users with optional query parameters
   * @param {*} req page, limit, individual parameters[username, phone, role], sortBy, sortOrder, search
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

      const validFilter = ["username", "phone", "role"];
      for (const key in req.query) {
        if (validFilter.includes(key)) {
          filterQuery[key] = req.query[key];
        }
      }

      //sort
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder?.toUpperCase();
      const validQuery = ["id", "username", "phone", "role"];
      if (sortBy && !validQuery.includes(sortBy)) {
        return res.status(400).json({ error: "Invalid sort field" });
      } else if (sortOrder && !["ASC", "DESC"].includes(sortOrder)) {
        return res.status(400).json({ error: "Invalid sort order" });
      }

      //search
      if (req.query.search) {
        filterQuery[Op.or] = [
          { username: { [Op.like]: `%${req.query.search}%` } },
          { phone: { [Op.like]: `%${req.query.search}%` } },
        ];
      }

      //#endregion

      // Create a unique cache key based on query params
      const cacheKey = `users:${JSON.stringify(req.query)}`;

      // Check if cached response exists
      const cached = await fetchCachedData(cacheKey);
      if (cached) {
        console.log("✅ Returning cached result");
        return res.status(200).json(JSON.parse(cached));
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: filterQuery,
        order: [[sortBy ? sortBy : "id", sortOrder ? sortOrder : "ASC"]],
        limit,
        offset,
      });
      const results = {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        users,
      };

      // Cache the response
      await setCacheData(cacheKey, JSON.stringify(results), 60);

      res.status(200).json(results);
    } catch (err) {
      res.status(500).json({
        error: "Failed to retrieve users information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region find one user
  /**
   * Finds a single user based on ID, with optional query parameters for registrations tied to user
   * @param {*} req id required in request params, exposed through ":id" in route
   * @param {*} res receive response
   * @returns
   */
  findOne: async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      //check id valid
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Valid user ID is required" });
      }

      //check if user exist
      const user = await User.findOne({
        where: { id: id, is_deleted: false },
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      //#region adding filter, sort and search

      //filter
      const filterQuery = {};
      filterQuery.user_id = id;
      filterQuery.is_deleted = false;

      const validFilter = ["status"];
      const validFilterValue = ["scheduled", "cancelled", "completed"];
      for (const key in req.query) {
        if (
          validFilter.includes(key) &&
          validFilterValue.includes(req.query[key])
        ) {
          filterQuery[key] = req.query[key];
        }
      }

      //sort
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder?.toUpperCase();
      const validQuery = ["id", "status"];
      if (sortBy && !validQuery.includes(sortBy)) {
        return res.status(400).json({ error: "Invalid sort field" });
      } else if (sortOrder && !["ASC", "DESC"].includes(sortOrder)) {
        return res.status(400).json({ error: "Invalid sort order" });
      }

      //#endregion

      // Create a unique cache key based on query params
      const cacheKey = `users:${JSON.stringify(id)}:${JSON.stringify(
        req.query
      )}`;

      // Check if cached response exists
      const cached = await fetchCachedData(cacheKey);
      if (cached) {
        console.log("✅ Returning cached result");
        return res.status(200).json(JSON.parse(cached));
      }

      const { count, rows: registrations } = await Registration.findAndCountAll(
        {
          where: filterQuery,
          include: [
            {
              model: Event,
              attributes: ["id","title", "date"],
            }
          ],
          order: [[sortBy ? sortBy : "id", sortOrder ? sortOrder : "ASC"]],
          limit,
          offset,
        }
      );
      const results = {
        user,
        registered: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit),
          registrations,
        },
      };

      // Cache the response
      await setCacheData(cacheKey, JSON.stringify(results), 60);

      res.status(200).json(results);
    } catch (err) {
      res.status(500).json({
        error: "Failed to retrieve user information",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region create user
  /**
   * Registers a user and sends email for verification link on auth route
   * @param {*} req request body parameters [email, username, password, role] required. Optional : [phone, image_url]
   * @param {*} res receive object with user email, verification link and message
   */
  create: async (req, res) => {
    //use transaction to ensure data consistency
    const t = await sequelize.transaction();

    //get request body
    const email = req?.body?.email || null;
    const username = req?.body?.username || null;
    const password = req?.body?.password || null;
    const role = req?.body?.role || null;
    const phone = req?.body?.phone || null;
    const image_url = req?.body?.image_url || null;
    const secret_code = req?.body?.secret_code || null;
    try {
      //required fields
      if (!email) {
        throw new Error("Email is required");
      } else if (!username) {
        throw new Error("Username is required");
      } else if (!password) {
        throw new Error("Password is required");
      } else if (!role || !["admin", "staff", "manager", "guest"].includes(role)) {
        throw new Error("Valid Role is required");
      }

      //validate role and secret code
      if (role === "admin" && secret_code !== process.env.COMPANY_ADMIN_SECRET) {
        throw new Error("Invalid Secret Code");
      }
      else if (role === "staff" && secret_code !== process.env.COMPANY_SIGNUP_SECRET) {
        throw new Error("Invalid Secret Code");
      }
      else if (role === "manager" && secret_code !== process.env.COMPANY_MANAGEMENT_SECRET) {
        throw new Error("Invalid Secret Code");
      }

      //check for uniqueness
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        throw new Error("Email already registered, please login instead");
      }
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        throw new Error("Username already used, please try another username");
      }

      //hash password
      const hashPw = await bcrypt.hash(password, 10);

      //create user
      const user = await User.create(
        {
          email,
          username,
          password: hashPw,
          role,
          phone,
          image_url,
        },
        { transaction: t }
      );

      //once successful, create verification token and setcache
      const verifyToken = uuid();
      await setCacheData(`verify:${verifyToken}`, String(user.id), 86400); // 24h expiry

      //set verification url
      // const verifyUrl = `http://localhost:${
      //   process.env.PORT || 8000
      // }/api/wellmesh/auth/verify-email?token=${verifyToken}`;

      const frontendVerifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify?token=${verifyToken}`;

      //send verification email
      await sendVerificationEmail(email, frontendVerifyUrl);

      //delete users cache
      await delPattern("users:*");

      //commit transaction
      await t.commit();
      res.status(201).json({
        message: "Account created. Check your email to verify.",
      });
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        error: "Failed to create new user",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region register event
  /**
   * register for an event, sends email as confirmation
   * @param {*} req request parameter id required, request body parameter event_id required
   * @param {*} res receive response, success message
   * @returns
   */
  registerEvent: async (req, res) => {
    //use transaction to ensure data consistency
    const t = await sequelize.transaction();

    //get request body
    const event_id = req?.body?.event_id || null;

    try {
      const { id } = req.params;

      //check id valid
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Valid user ID is required" });
      }
      if (!event_id || isNaN(Number(event_id))) {
        return res.status(400).json({ error: "Valid event ID is required" });
      }

      //check user exists
      const hasUser = await User.findOne(
        { where: { id: id, is_deleted: false } },
        { transaction: t }
      );
      if (!hasUser) {
        throw new Error("User not found");
      }


      //check event exists
      const hasEvent = await Event.findOne(
        { where: { id: event_id, is_deleted: false } },
        { transaction: t }
      );
      if (!hasEvent) {
        throw new Error("Event not found");
      }



      //check if user already registered
      const hasRegistration = await Registration.findOne({
        where: { user_id: id, event_id: event_id, is_deleted: false },
        transaction: t,
      });
      if (hasRegistration) {
        throw new Error("You have already registered for this event");
      }


      //check event has slots available
      const hasSlots = JSON.parse(hasEvent.available_pax) - 1;
      if (hasSlots < 0) {
        throw new Error("No slots available for this event");
      }



      //create registration
      await Registration.create(
        {
          event_id: event_id,
          user_id: id,
          status: "scheduled",
        },
        { transaction: t }
      );


      //update event available pax
      await Event.update(
        { available_pax: hasSlots },
        { where: { id: event_id, is_deleted: false }, transaction: t } 
      );


      //send email
      await sendEventRegistrationEmail(hasUser.email, hasEvent);


      //delete events cache (event-registrations)
      await delPattern(`events:id:${JSON.stringify(event_id)}*`);

      //commit transaction
      await t.commit();
      res.status(201).json({ message: "Registration successful" });
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        error: "Failed to register for event",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region update user
  /**
   * update user based on parameters
   * @param {*} req id required from request params, [username, email, phone, newPassword, oldPassword, image_url, role] from request body optional
   * @param {*} res receive updated user object
   * @returns
   */
  update: async (req, res) => {
    //use transaction to ensure data consistency
    const t = await sequelize.transaction();

    //limit fields
    const properties = Object.keys(req.body);
    const allowedProperties = [
      "username",
      "email",
      "phone",
      "newPassword",
      "oldPassword",
      "image_url",
      "role",
      "secret_code",
    ];
    try {
      const { id } = req.params;
      //check id valid
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Valid user ID is required" });
      }

      //check user exists
      const hasUser = await User.findOne(
        { where: { id: id, is_deleted: false } },
        { transaction: t }
      );
      if (!hasUser) {
        throw new Error("User not found");
      }

      //#region check body fields
      let matchingProperties = properties.filter((p) =>
        allowedProperties.includes(p)
      );
      if (matchingProperties.length === 0) {
        return res.status(400).json({ error: "No valid properties to update" });
      }
      //create new body for valid fields
      const newBody = {};
      if (matchingProperties.includes("phone")) {
        newBody.phone = req.body.phone;
      }
      if (matchingProperties.includes("image_url")) {
        newBody.image_url = req.body.image_url;
      }
      if (
        matchingProperties.includes("role") &&
        ["admin", "manager", "staff"].includes(req.body.role) &&
        hasUser.role !== req.body.role &&
        matchingProperties.includes("secret_code")
      ) {
        if(req.body.role === "admin" && req.body.secret_code !== process.env.COMPANY_ADMIN_SECRET){
          return res.status(400).json({ error: "Invalid admin secret code" });
        }
        else if(req.body.role === "manager" && req.body.secret_code !== process.env.COMPANY_MANAGEMENT_SECRET){
          return res.status(400).json({ error: "Invalid manager secret code" });
        }
        else if (req.body.role === "staff" && req.body.secret_code !== process.env.COMPANY_SIGNUP_SECRET){
          return res.status(400).json({ error: "Invalid staff secret code" });
        }
        newBody.role = req.body.role;
      }
      if (matchingProperties.includes("username") && hasUser.username !== req.body.username) {
        const existingUsername = await User.findOne(
          { where: { username: req.body.username } },
          { transaction: t }
        );
        if (existingUsername) {
          throw new Error("Username already used, please try another username");
        } else {
          newBody.username = req.body.username;
        }
      }
      if (matchingProperties.includes("email") && hasUser.email !== req.body.email) {
        const existingEmail = await User.findOne(
          { where: { email: req.body.email } },
          { transaction: t }
        );
        if (existingEmail) {
          throw new Error(
            "Email already registered, please use another instead"
          );
        } else {
          newBody.email = req.body.email;
        }
      }
      if (
        matchingProperties.includes("newPassword") &&
        !matchingProperties.includes("oldPassword")
      ) {
        throw new Error("Old password is required");
      }
      if (
        matchingProperties.includes("oldPassword") &&
        !matchingProperties.includes("newPassword")
      ) {
        throw new Error("New password is required");
      }
      if (
        matchingProperties.includes("newPassword") &&
        matchingProperties.includes("oldPassword")
      ) {
        const verifyOldPw = await bcrypt.compare(
          req.body.oldPassword,
          hasUser.password
        );
        if (!verifyOldPw) {
          throw new Error("Incorrect old password");
        } else {
          const hashPw = await bcrypt.hash(req.body.newPassword, 10);
          newBody.password = hashPw;
        }
      }

      //#endregion

      //update user
      await User.update(
        newBody,
        { where: { id: id, is_deleted: false }, transaction: t }
      );

      const updatedUser = await User.findOne(
        { where: { id: id, is_deleted: false } },
        { transaction: t }
      );

      //delete users cache
      await delPattern("users:*");

      //commit transaction
      await t.commit();
      res.status(200).json(updatedUser);
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        error: "Failed to update new user",
        details: err.message,
      });
    }
  },
  //#endregion
  //#region delete user (soft delete)
  /**
   * soft delete user (via setting is_deleted to true) and update dependencies
   * @param {*} req id required from request params
   * @param {*} res receive response, success message
   * @returns
   */
  delete: async (req, res) => {
    //use transaction to ensure data consistency
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      //check id valid
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Valid user ID is required" });
      }

      //check user exists
      const hasUser = await User.findOne(
        { where: { id: id, is_deleted: false } },
        { transaction: t }
      );
      if (!hasUser) {
        throw new Error("User not found");
      }

      //update user
      await User.update(
        { is_deleted: true },
        { where: { id: id, is_deleted: false }, transaction: t }
      );

      //update dependency
      await Registration.update(
        { is_deleted: true },
        { where: { user_id: id, is_deleted: false }, transaction: t }
      );

      //delete users cache
      await delPattern("users:*");

      //commit transaction
      await t.commit();
      res.status(200).json("User removed successfully");
    } catch (err) {
      await t.rollback();
      res.status(500).json({
        error: "Failed to remove user",
        details: err.message,
      });
    }
  },
  //#endregion
};

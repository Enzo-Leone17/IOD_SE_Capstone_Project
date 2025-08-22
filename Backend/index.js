//env config
require('dotenv').config();

// server.js (Express App Entry Point)
const express = require("express");
const cors = require("cors");
const helmet = require('helmet');
const app = express();
const port = process.env.PORT || 8000;

// Load Sequelize and models
const db = require("./models");

// Middleware
const rateLimiter = require("./middleware/rateLimiter");
const authLimiter = rateLimiter(20, 60);
const apiLimiter = rateLimiter(40, 60);
app.use(helmet());
app.use(cors());
app.use(express.json());



// Routes
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const activityRoutes = require("./routes/activity.routes");
const locationRoutes = require("./routes/location.routes");
const mediaRoutes = require("./routes/media.routes");

//listen to routes
app.use("/api/wellmesh/users", apiLimiter, userRoutes);
app.use("/api/wellmesh/auth", authLimiter, authRoutes);
app.use("/api/wellmesh/events", apiLimiter,  eventRoutes);
app.use("/api/wellmesh/activities", apiLimiter, activityRoutes);
app.use("/api/wellmesh/locations", apiLimiter, locationRoutes);
app.use("/api/wellmesh/medias", apiLimiter, mediaRoutes);


// Connect to DB
db.sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

// Start server
app.listen(port, () => {
  console.log(`Running on the port http://localhost:${port}`);
});

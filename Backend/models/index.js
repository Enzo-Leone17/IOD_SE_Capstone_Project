'use strict';

//require dependencies and config
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const process = require('process');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

//create sequelize instance
const sequelize = new Sequelize(config);
db.sequelize = sequelize;
db.Sequelize = Sequelize;

//define database models
db.User = require("./user")(sequelize, DataTypes);
db.RefreshToken = require("./refreshToken")(sequelize, DataTypes);
db.Media = require("./media")(sequelize, DataTypes);
db.Registration = require("./registration")(sequelize, DataTypes);
db.Location = require("./location")(sequelize, DataTypes);
db.Activity = require("./activity")(sequelize, DataTypes);
db.Payment = require("./payment")(sequelize, DataTypes);
db.Event = require("./event")(sequelize, DataTypes);
db.Event_Activity = require("./event_activities")(sequelize, DataTypes);

//#region associations

//refresh tokens and user
db.User.hasMany(db.RefreshToken, { foreignKey: "user_id" });
db.RefreshToken.belongsTo(db.User, { foreignKey: "user_id"});

//media and activity
db.Activity.hasMany(db.Media, { foreignKey: "activity_id" });
db.Media.belongsTo(db.Activity, { foreignKey: "activity_id" });

//events and location
db.Location.hasMany(db.Event, { foreignKey: "location_id" });
db.Event.belongsTo(db.Location, { foreignKey: "location_id"});

//events and activites
db.Event.hasMany(db.Event_Activity, { foreignKey: "event_id" });
db.Event_Activity.belongsTo(db.Event, { foreignKey: "event_id"});
db.Activity.hasMany(db.Event_Activity, { foreignKey: "activity_id" });
db.Event_Activity.belongsTo(db.Activity, { foreignKey: "activity_id"});
db.Event.belongsToMany(db.Activity, { through: db.Event_Activity, foreignKey: "event_id" , otherKey: "activity_id" });
db.Activity.belongsToMany(db.Event, { through: db.Event_Activity, foreignKey: "activity_id" , otherKey: "event_id" });

//events and user(host)
db.User.hasMany(db.Event, { foreignKey: "host_user_id" });
db.Event.belongsTo(db.User, { foreignKey: "host_user_id"});

//events and user(participant) via registration
db.User.hasMany(db.Registration, { foreignKey: "user_id" });
db.Registration.belongsTo(db.User, { foreignKey: "user_id"});
db.Event.hasMany(db.Registration, { foreignKey: "event_id" });
db.Registration.belongsTo(db.Event, { foreignKey: "event_id"});

//user and payments
db.User.hasMany(db.Payment, { foreignKey: "user_id" });
db.Payment.belongsTo(db.User, { foreignKey: "user_id"});

//event and payments
db.Event.hasMany(db.Payment, { foreignKey: "event_id" });
db.Payment.belongsTo(db.Event, { foreignKey: "event_id"});

//#endregion

module.exports = db;

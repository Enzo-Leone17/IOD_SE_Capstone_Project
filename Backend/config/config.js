require("dotenv").config();
module.exports = {
  development: {
    username: process.env.DB_HOSTNAME,
    password: process.env.DB_HOSTPASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_DEVHOST,
    dialect: "mysql",
  },
  production: {
    username: process.env.DB_HOSTNAME,
    password: process.env.DB_HOSTPASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_PRODHOST,
    dialect: "mysql",
  },
};

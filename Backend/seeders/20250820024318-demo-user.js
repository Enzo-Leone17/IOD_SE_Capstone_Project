"use strict";
const bcrypt = require("bcrypt");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const adminPassword = await bcrypt.hash("Admin123", 10);
    const managerPassword = await bcrypt.hash("Manager123", 10);
    const staffPassword = await bcrypt.hash("Staff123", 10);
    // Users
    const users = Array.from({ length: 20 }, (_, i) => ({ 
      username:
      i === 0 ? "Admin" :
        (i + 1) % 4 === 0
          ? `Manager${(i + 1) / 4}`
          : `Staff${i + 1 - Math.floor(i / 4)}`,
      password: i === 0 ? adminPassword : (i + 1) % 4 === 0 ? managerPassword : staffPassword,
      email:
      i === 0 ? "admin@workplace.com" :
        (i + 1) % 4 === 0
          ? `Manager${(i + 1) / 4}@workplace.com`
          : `Staff${i + 1 - Math.floor(i / 4)}@workplace.com`,
      role: i === 0 ? "admin" :(i + 1) % 4 === 0 ? "manager" : "staff",
      is_verified: true,
      created_at: now,
      updated_at: now,
      is_deleted: false,
    }));

    
    await queryInterface.bulkInsert("users", users);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};

//Using express routing
const express = require("express");
const router = express.Router();
//controller
const userController = require("../controllers/user.controller");
//auth middleware
const { authService } = require("../middleware/authService");

//routes endpoint
router.get("/", authService(false, ["admin","manager"]), userController.findAll);
router.get("/:id", authService(true), userController.findOne);
router.post("/create", userController.create);
router.post("/:id/register_event", authService(true, ["admin","manager", "staff"]), userController.registerEvent);
router.put("/update/:id", authService(true), userController.update);
router.put("/remove/:id", authService(false, ["admin","manager"]), userController.delete);

module.exports = router;
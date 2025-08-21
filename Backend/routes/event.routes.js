//Using express routing
const express = require("express");
const router = express.Router();
//controller
const eventController = require("../controllers/event.controller");
//auth middleware
const { authService } = require("../middleware/authService");

//routes endpoint
router.get("/", authService(), eventController.findAll);
router.get("/:id", authService(), eventController.findOne);
router.get("/:id/registrations", authService(false , ["admin","manager"]), eventController.findAllRegistrations);
router.post("/create", authService(false , ["admin","manager"]), eventController.create);
router.put("/update/:id", authService(false , ["admin","manager"]), eventController.update);
router.put("/remove/:id", authService(false , ["admin","manager"]), eventController.delete);

module.exports = router;
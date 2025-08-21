//Using express routing
const express = require("express");
const router = express.Router();
//controller
const eventController = require("../controllers/event.controller");

//routes endpoint
router.get("/", eventController.findAll);
router.get("/:id", eventController.findOne);
router.get("/:id/registrations", eventController.findAllRegistrations);
router.post("/create", eventController.create);
router.put("/update/:id", eventController.update);
router.put("/remove/:id", eventController.delete);

module.exports = router;
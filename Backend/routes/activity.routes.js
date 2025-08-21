//Using express routing
const express = require("express");
const router = express.Router();
//controller
const activityController = require("../controllers/activity.controller");

//routes endpoint
router.get("/", activityController.findAll);
router.get("/:id", activityController.findOne);
router.post("/create", activityController.create);
router.put("/update/:id", activityController.update);
router.put("/remove/:id", activityController.delete);

module.exports = router;
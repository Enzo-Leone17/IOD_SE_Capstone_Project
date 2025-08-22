//Using express routing
const express = require("express");
const router = express.Router();
//controller
const activityController = require("../controllers/activity.controller");
//auth middleware
const { authService } = require("../middleware/authService");

//routes endpoint
router.get("/", authService(), activityController.findAll);
router.get("/:id", authService(), activityController.findOne);
router.post("/create", authService(false , ["admin","manager"]), activityController.create);
router.put("/update/:id", authService(false , ["admin","manager"]), activityController.update);
router.put("/remove/:id", authService(false , ["admin","manager"]), activityController.delete);

module.exports = router;
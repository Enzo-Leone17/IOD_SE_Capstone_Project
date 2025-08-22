//Using express routing
const express = require("express");
const router = express.Router();
//controller
const locationController = require("../controllers/location.controller");
//auth middleware
const { authService } = require("../middleware/authService");

//routes endpoint
router.get("/", authService(), locationController.findAll);
router.get("/:id", authService(), locationController.findOne);
router.post("/create", authService(false , ["admin","manager"]), locationController.create);
router.put("/update/:id", authService(false , ["admin","manager"]), locationController.update);
router.put("/remove/:id", authService(false , ["admin","manager"]), locationController.delete);

module.exports = router;
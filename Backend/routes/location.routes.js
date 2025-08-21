//Using express routing
const express = require("express");
const router = express.Router();
//controller
const locationController = require("../controllers/location.controller");

//routes endpoint
router.get("/", locationController.findAll);
router.get("/:id", locationController.findOne);
router.post("/create", locationController.create);
router.put("/update/:id", locationController.update);
router.put("/remove/:id", locationController.delete);

module.exports = router;
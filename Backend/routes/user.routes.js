//Using express routing
const express = require("express");
const router = express.Router();
//controller
const userController = require("../controllers/user.controller");

//routes endpoint
router.get("/", userController.findAll);
router.get("/:id", userController.findOne);
router.post("/create", userController.create);
router.post("/:id/register_event", userController.registerEvent);
router.put("/update/:id", userController.update);
router.put("/remove/:id", userController.delete);

module.exports = router;
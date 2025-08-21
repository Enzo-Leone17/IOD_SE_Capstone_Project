//Using express routing
const express = require("express");
const router = express.Router();
//controller
const mediaController = require("../controllers/media.controller");

router.get("/", mediaController.findAll);
router.get("/:id", mediaController.findOne);
router.post("/create", mediaController.create);
router.put("/update/:id", mediaController.update);
router.put("/remove/:id", mediaController.delete);

module.exports = router;
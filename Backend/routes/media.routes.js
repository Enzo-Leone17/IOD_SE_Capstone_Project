//Using express routing
const express = require("express");
const router = express.Router();
//controller
const mediaController = require("../controllers/media.controller");
//auth middleware
const { authService } = require("../middleware/authService");

router.get("/", authService(), mediaController.findAll);
router.get("/:id", authService(), mediaController.findOne);
router.post("/create", authService(false , ["admin","manager"]), mediaController.create);
router.put("/update/:id", authService(false , ["admin","manager"]), mediaController.update);
router.put("/remove/:id", authService(false , ["admin","manager"]), mediaController.delete);

module.exports = router;
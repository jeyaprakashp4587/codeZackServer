const express = require("express");
const router = express.Router();
const followingController = require("../controllers/followingController");

// Routes
router.post("/findExistsConnection", followingController.findExistsConnection);
router.post("/addConnection", followingController.addConnection);
router.post("/removeConnection/:id", followingController.removeConnection);
router.post("/getMutuals", followingController.getMutuals);
router.get("/getNetworks/:id", followingController.getNetworks);

module.exports = router;

const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

// Routes
router.post("/updateProfileImages", profileController.updateProfileImages);
router.post("/updateProfileData/:id", profileController.updateProfileData);
router.post("/saveFcmToken", profileController.saveFcmToken);
router.post("/setOnlineStatus/:id", profileController.setOnlineStatus);
router.get("/Getlatest-version", profileController.getLatestVersion);

module.exports = router;

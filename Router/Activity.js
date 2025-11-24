const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");

// Routes
router.post("/setActivity/:id", activityController.setActivity);
router.get("/getAllActivityDates/:id", activityController.getAllActivityDates);
router.post("/getParticularDateActivities/:id", activityController.getParticularDateActivities);

module.exports = router;

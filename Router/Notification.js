const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// Routes
router.get("/getNotifications/:userId", notificationController.getNotifications);
router.get("/getNotificationsLength/:id", notificationController.getNotificationsLength);
router.patch("/markAsSeen/:userId/:notificationId", notificationController.markAsSeen);

module.exports = router;

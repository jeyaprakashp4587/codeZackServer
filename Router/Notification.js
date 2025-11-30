import express from "express";
const router = express.Router();
import * as notificationController from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/JWT.js";

// Routes (lowercase paths)
router.use(verifyToken);
router.get(
  "/getnotifications/:userId",
  notificationController.getNotifications
);
router.get(
  "/getnotificationslength/:id",
  notificationController.getNotificationsLength
);
router.patch(
  "/markasseen/:userId/:notificationId",
  notificationController.markAsSeen
);

export default router;

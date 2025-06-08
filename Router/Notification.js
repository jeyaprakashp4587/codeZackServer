const express = require("express");
const router = express.Router();
const User = require("../Models/User");

// GET request to fetch all notifications for a user
router.get("/getNotifications/:userId", async (req, res) => {
  const { userId } = req.params;
  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  try {
    // Only select Notifications field to reduce DB payload
    const user = await User.findById(userId).select("Notifications");
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }
    const allNotifications = user.Notifications || [];
    if (allNotifications.length === 0) {
      return res.status(200).send({
        notifications: [],
        totalPages: 0,
        totalNotifications: 0,
      });
    }
    // Sort by Time DESC (newest first)
    const sorted = allNotifications.sort(
      (a, b) => new Date(b.Time) - new Date(a.Time)
    );
    // Paginate
    const start = (page - 1) * limit;
    const paginated = sorted.slice(start, start + limit);
    // Prepare unique sender IDs to avoid duplicate DB calls
    const senderIds = [
      ...new Set(paginated.map((n) => n.NotificationSender.toString())),
    ];
    // Fetch all senders in one go 💨
    const senders = await User.find(
      { _id: { $in: senderIds } },
      "firstName LastName Images.profile"
    ).lean();
    // Map senderId to sender data for quick lookup
    const senderMap = new Map();
    senders.forEach((sender) => {
      senderMap.set(sender._id.toString(), sender);
    });
    // Final result
    const notificationsWithSender = paginated.map((notification) => {
      const sender = senderMap.get(notification.NotificationSender.toString());
      return {
        NotificationId: notification._id,
        NotificationType: notification.NotificationType,
        NotificationText: notification.NotificationText,
        NotificationSender: notification.NotificationSender,
        Time: notification.Time,
        seen: notification.seen,
        senderFirstName: sender?.firstName || "Unknown",
        senderLastName: sender?.LastName || "User",
        senderProfileImage: sender?.Images?.profile || null,
        postId: notification.postId || null,
      };
    });
    res.status(200).send({
      notifications: notificationsWithSender,
      currentPage: page,
      totalPages: Math.ceil(allNotifications.length / limit),
      totalNotifications: allNotifications.length,
    });
  } catch (error) {
    res.status(500).send({ message: "Server error.", error: error.message });
  }
});
// Get Notification length
router.get("/getNotificationsLength/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const unSeenNotification = user.Notifications.filter(
      (notification) => !notification.seen
    );
    return res.status(200).json({ notiLength: unSeenNotification.length });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
// PATCH request to mark a notification as seen
router.patch("/markAsSeen/:userId/:notificationId", async (req, res) => {
  const { notificationId } = req.params;

  try {
    const user = await User.findById(req.params.userId);
    if (user) {
      const notificationIndex = user.Notifications.findIndex(
        (notification) =>
          notification._id.toString() === req.params.notificationId
      );
      if (notificationIndex !== -1) {
        // Mark the notification as seen
        user.Notifications[notificationIndex].seen = true;
        await user.save();
        res.status(200).send(user.Notifications[notificationIndex]);
      } else {
        res.status(404).send({ message: "Notification not found." });
      }
    } else {
      res.status(404).send({ message: "User not found." });
    }
  } catch (error) {
    res.status(500).send({ message: "Server error.", error: error.message });
  }
});
module.exports = router;

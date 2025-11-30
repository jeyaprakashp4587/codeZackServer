import User from "../Models/User.js";

// Get notifications
const getNotifications = async (req, res) => {
  const { userId } = req.params;
  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  try {
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
    const sorted = allNotifications.sort(
      (a, b) => new Date(b.Time) - new Date(a.Time)
    );
    const start = (page - 1) * limit;
    const paginated = sorted.slice(start, start + limit);
    const senderIds = [
      ...new Set(paginated.map((n) => n.NotificationSender.toString())),
    ];
    const senders = await User.find(
      { _id: { $in: senderIds } },
      "firstName LastName Images.profile"
    ).lean();
    const senderMap = new Map();
    senders.forEach((sender) => {
      senderMap.set(sender._id.toString(), sender);
    });
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
};

// Get notifications length
const getNotificationsLength = async (req, res) => {
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
};

// Mark as seen
const markAsSeen = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const user = await User.findById(req.params.userId);
    if (user) {
      const notificationIndex = user.Notifications.findIndex(
        (notification) =>
          notification._id.toString() === req.params.notificationId
      );
      if (notificationIndex !== -1) {
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
};

export {
  getNotifications,
  getNotificationsLength,
  markAsSeen,
};


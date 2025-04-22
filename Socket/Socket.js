const Socket = require("socket.io");
const User = require("../Models/User");
const initializeFirebaseAdmin = require("../firebase/firebaseAdmin");
const moment = require("moment");
const initializeSocket = (server) => {
  const io = Socket(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  // Initialize Firebase Admin
  const admin = initializeFirebaseAdmin();
  // Socket initialization
  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    // Update the socket ID in the database
    if (userId) {
      try {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { SocketId: socket.id },
          { new: true }
        );
        console.log(
          `User connected: ${updatedUser?.firstName} with socket ID: ${socket.id}`
        );
      } catch (error) {
        console.error("Error updating SocketId:", error.message);
      }
    }
    // check user notifiation
    socket.on("checkNotification", (data) => {
      try {
        if (data.socketId == socket.id) {
          // console.log(data.socketId);
          io.to(data.socketId).emit("updateNoti", { text: "update" });
        }
      } catch (error) {}
    });
    // Listen for notification events
    socket.on("sendNotificationForConnection", async (data) => {
      const { ReceiverId, SenderId, Time } = data;

      try {
        const [Receiver, Sender] = await Promise.all([
          User.findById(ReceiverId),
          User.findById(SenderId),
        ]);

        if (Receiver) {
          Receiver.Notifications.unshift({
            NotificationType: "connection",
            NotificationText: `You are Connected With ${Sender.firstName} ${Sender.LastName}`,
            NotificationSender: SenderId,
            Time,
          });
          await Receiver.save();
          if (Receiver.SocketId) {
            io.to(Receiver.SocketId).emit("Receive-Noti", {
              text: `You are Connected With ${Sender.firstName} ${Sender.LastName}`,
            });
            io.to(Receiver.SocketId).emit("getHomeBadge", { text: "ok" });
          }

          // Send FCM Notification
          if (Receiver.FcmId) {
            await admin.messaging().send({
              token: Receiver.FcmId,
              notification: {
                title: "New Connection!",
                body: `You are connected with ${Sender.firstName} ${Sender.LastName}`,
                imageUrl: Sender.Images.profile,
              },
              android: {
                notification: {
                  icon: "https://i.ibb.co/j6qShGt/CC.png", // Android-specific icon
                },
              },
              data: {
                type: "connection",
                senderId: SenderId,
                time: Time,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error sending notification:", error.message);
      }
    });

    // Handle post notifications for user's connections
    socket.on("PostNotiToConnections", async (data) => {
      const { Time, postId } = data;

      try {
        const user = await User.findById(userId);
        const userConnections = user.Connections.map(
          (conn) => conn.ConnectionsdId
        );

        const connectionsUsers = await User.find({
          _id: { $in: userConnections },
        });

        // Send FCM Notifications to all connections
        const fcmTokens = connectionsUsers
          .filter((connUser) => connUser.FcmId)
          .map((connUser) => connUser.FcmId);

        if (fcmTokens.length > 0) {
          await admin.messaging().sendMulticast({
            tokens: fcmTokens,
            notification: {
              title: "New Post!",
              body: `${user.firstName} ${user.LastName} uploaded a new post`,
            },
            android: {
              notification: {
                icon: "https://i.ibb.co/j6qShGt/CC.png", // Android-specific icon
              },
            },
            data: {
              type: "post",
              senderId: user._id.toString(),
              postId,
              time: Time,
            },
          });
        }

        // Emit socket notifications
        connectionsUsers.forEach(async (connUser) => {
          connUser.Notifications.unshift({
            NotificationType: "post",
            NotificationText: `${user.firstName} ${user.LastName} uploaded a post`,
            NotificationSender: user._id,
            Time,
            postId,
          });

          await connUser.save();

          if (connUser.SocketId) {
            io.to(connUser.SocketId).emit("Receive-Noti", {
              text: `${user.firstName} ${user.LastName} uploaded a post`,
            });
            io.to(connUser.SocketId).emit("getFeedBadge", { text: "ok" });
          }
        });
      } catch (error) {
        console.error("Error notifying connections:", error.message);
      }
    });
    // share a post to connection
    socket.on("SharePostToConnection", async (data, callback) => {
      const { receivingUserId, postId } = data;
      const time = moment().format("YYYY-MM-DDTHH:mm:ss");
      try {
        const user = await User.findById(userId);
        if (!user) throw new Error("Sharing user not found");
        const receivingUser = await User.findById(receivingUserId);
        if (!receivingUser) throw new Error("Receiving user not found");
        receivingUser.Notifications.unshift({
          NotificationType: "post",
          NotificationText: `${user.firstName} ${user.LastName} sent a post`,
          NotificationSender: user._id,
          Time: time,
          postId,
        });
        await receivingUser.save();
        if (receivingUser.FcmId) {
          await admin.messaging().send({
            token: receivingUser.FcmId,
            notification: {
              title: "New Shared Post!",
              body: `${user.firstName} ${user.LastName} sent a post`,
            },
            android: {
              notification: {
                icon: "https://i.ibb.co/j6qShGt/CC.png", // Android-specific icon
              },
            },
          });
        }
        if (receivingUser.SocketId) {
          io.to(receivingUser.SocketId).emit("Receive-Noti", {
            text: `${user.firstName} ${user.LastName} sent a post`,
            postId,
            time,
          });
          io.to(receivingUser.SocketId).emit("getHomeBadge", { text: "ok" });
        }
        // console.log("Notification sent to post receiver");
        if (callback) {
          callback({ success: true });
        }
      } catch (error) {
        console.error(
          "Error sharing post or notifying receiver:",
          error.message
        );
        if (callback) {
          callback({ success: false });
        }
      }
    });

    // Send a notification ro post uploader
    socket.on("LikeNotiToUploader", async (data) => {
      const { Time, postId, senderId } = data;

      try {
        const user = await User.findById(userId);
        const postSender = await User.findById(senderId);

        if (user && postSender) {
          postSender.Notifications.push({
            NotificationSender: user._id,
            NotificationType: "post",
            NotificationText: `${user.firstName} ${user.LastName} liked your post`,
            Time,
            postId,
          });

          await postSender.save();

          if (postSender.SocketId) {
            io.to(postSender.SocketId).emit("Receive-Noti", {
              text: `${user.firstName} ${user.LastName} liked your post`,
            });
            io.to(postSender.SocketId).emit("getHomeBadge", { text: "ok" });
          }

          // Send FCM Notification
          if (postSender.FcmId) {
            await admin.messaging().send({
              token: postSender.FcmId,
              notification: {
                title: "Your Post Got a Like!",
                body: `${user.firstName} ${user.LastName} liked your post`,
                imageUrl: user.Images.profile,
              },
              android: {
                notification: {
                  icon: "https://i.ibb.co/j6qShGt/CC.png",
                },
              },
              data: {
                type: "like",
                postId,
                senderId: user._id.toString(),
                time: Time,
              },
            });
          }
        }
      } catch (err) {
        console.error("Error sending like notification:", err.message);
      }
    });

    // Send notification to post uploader when a comment is added
    socket.on("CommentNotiToUploader", async (data) => {
      const { Time, postId, senderId } = data;

      try {
        const user = await User.findById(userId);
        const postSender = await User.findById(senderId);

        if (user && postSender) {
          postSender.Notifications.push({
            NotificationSender: user._id,
            NotificationType: "post",
            NotificationText: `${user.firstName} ${user.LastName} commented on your post`,
            Time,
            postId,
          });

          await postSender.save();

          if (postSender.SocketId) {
            io.to(postSender.SocketId).emit("Receive-Noti", {
              text: `${user.firstName} ${user.LastName} commented on your post`,
            });
            io.to(postSender.SocketId).emit("getHomeBadge", { text: "ok" });
          }

          // Send FCM Notification
          if (postSender.FcmId) {
            await admin.messaging().send({
              token: postSender.FcmId,
              notification: {
                title: "New Comment!",
                body: `${user.firstName} ${user.LastName} commented on your post`,
                imageUrl: user.Images.profile,
                icon: "https://i.ibb.co/j6qShGt/CC.png",
              },
              data: {
                type: "comment",
                postId,
                senderId: user._id.toString(),
                time: Time,
              },
            });
          }
        }
      } catch (err) {
        console.error("Error sending comment notification:", err.message);
      }
    });
  });
};

module.exports = initializeSocket;

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

  const admin = initializeFirebaseAdmin();

  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;

    if (!userId) {
      console.warn("No userId provided in socket connection.");
      return;
    }

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

    // === CHECK NOTIFICATION
    socket.on("checkNotification", (data) => {
      if (data?.socketId === socket.id) {
        io.to(data.socketId).emit("updateNoti", { text: "update" });
      }
    });

    // === SEND CONNECTION NOTIFICATION
    socket.on(
      "sendNotificationForConnection",
      async ({ ReceiverId, SenderId, Time }) => {
        try {
          const [Receiver, Sender] = await Promise.all([
            User.findById(ReceiverId),
            User.findById(SenderId),
          ]);

          if (!Receiver || !Sender) return;

          Receiver.Notifications.unshift({
            NotificationType: "connection",
            NotificationText: `You are Connected With ${Sender.firstName} ${Sender.LastName}`,
            NotificationSender: SenderId,
            Time,
          });

          await Receiver.save();

          // Socket
          if (Receiver.SocketId) {
            io.to(Receiver.SocketId).emit("Receive-Noti", {
              text: `You are Connected With ${Sender.firstName} ${Sender.LastName}`,
            });
            io.to(Receiver.SocketId).emit("getHomeBadge", { text: "ok" });
          }

          // FCM
          if (Receiver.FcmId) {
            await admin.messaging().send({
              token: Receiver.FcmId,
              notification: {
                title: "New Connection!",
                body: `You are connected with ${Sender.firstName} ${Sender.LastName}`,
                imageUrl: Sender.Images?.profile,
              },
              android: {
                notification: { icon: "https://i.ibb.co/j6qShGt/CC.png" },
              },
              data: {
                type: "connection",
                senderId: SenderId,
                time: Time,
              },
            });
          }
        } catch (error) {
          console.error(
            "Error sending connection notification:",
            error.message
          );
        }
      }
    );

    // === POST NOTIFICATION TO CONNECTIONS
    socket.on("PostNotiToConnections", async ({ Time, postId }) => {
      try {
        const user = await User.findById(userId);
        if (!user) return;

        const connectionIds = user.Connections.map((c) => c.ConnectionsdId);
        const connections = await User.find({ _id: { $in: connectionIds } });

        const fcmTokens = [];
        for (const conn of connections) {
          conn.Notifications.unshift({
            NotificationType: "post",
            NotificationText: `${user.firstName} ${user.LastName} uploaded a post`,
            NotificationSender: user._id,
            Time,
            postId,
          });

          await conn.save();

          if (conn.SocketId) {
            io.to(conn.SocketId).emit("Receive-Noti", {
              text: `${user.firstName} ${user.LastName} uploaded a post`,
            });
            io.to(conn.SocketId).emit("getFeedBadge", { text: "ok" });
          }

          if (conn.FcmId) fcmTokens.push(conn.FcmId);
        }

        if (fcmTokens.length > 0) {
          await admin.messaging().sendMulticast({
            tokens: fcmTokens,
            notification: {
              title: "New Post!",
              body: `${user.firstName} ${user.LastName} uploaded a new post`,
            },
            android: {
              notification: { icon: "https://i.ibb.co/j6qShGt/CC.png" },
            },
            data: {
              type: "post",
              senderId: user._id.toString(),
              postId,
              time: Time,
            },
          });
        }
      } catch (error) {
        console.error("Error in PostNotiToConnections:", error.message);
      }
    });

    // === SHARE POST TO CONNECTION
    socket.on(
      "SharePostToConnection",
      async ({ receivingUserId, postId }, callback) => {
        const time = moment().format("YYYY-MM-DDTHH:mm:ss");
        try {
          const sender = await User.findById(userId);
          const receiver = await User.findById(receivingUserId);
          if (!sender || !receiver) throw new Error("User not found");

          receiver.Notifications.unshift({
            NotificationType: "post",
            NotificationText: `${sender.firstName} ${sender.LastName} sent a post`,
            NotificationSender: sender._id,
            Time: time,
            postId,
          });
          await receiver.save();

          if (receiver.FcmId) {
            await admin.messaging().send({
              token: receiver.FcmId,
              notification: {
                title: "New Shared Post!",
                body: `${sender.firstName} ${sender.LastName} sent a post`,
                imageUrl: sender.Images?.profile,
              },
              android: {
                notification: { icon: "https://i.ibb.co/j6qShGt/CC.png" },
              },
            });
          }

          if (receiver.SocketId) {
            io.to(receiver.SocketId).emit("Receive-Noti", {
              text: `${sender.firstName} ${sender.LastName} sent a post`,
              postId,
              time,
            });
            io.to(receiver.SocketId).emit("getHomeBadge", { text: "ok" });
          }

          if (callback) callback({ success: true });
        } catch (error) {
          console.error("SharePostToConnection error:", error.message);
          if (callback) callback({ success: false });
        }
      }
    );

    // === LIKE NOTIFICATION
    socket.on("LikeNotiToUploader", async ({ Time, postId, senderId }) => {
      try {
        const liker = await User.findById(userId);
        const postOwner = await User.findById(senderId);
        if (!liker || !postOwner) return;

        postOwner.Notifications.push({
          NotificationSender: liker._id,
          NotificationType: "post",
          NotificationText: `${liker.firstName} ${liker.LastName} liked your post`,
          Time,
          postId,
        });
        await postOwner.save();

        if (postOwner.SocketId) {
          io.to(postOwner.SocketId).emit("Receive-Noti", {
            text: `${liker.firstName} ${liker.LastName} liked your post`,
          });
          io.to(postOwner.SocketId).emit("getHomeBadge", { text: "ok" });
        }

        if (postOwner.FcmId) {
          await admin.messaging().send({
            token: postOwner.FcmId,
            notification: {
              title: "Your Post Got a Like!",
              body: `${liker.firstName} ${liker.LastName} liked your post`,
              imageUrl: liker.Images?.profile,
            },
            android: {
              notification: { icon: "https://i.ibb.co/j6qShGt/CC.png" },
            },
            data: {
              type: "like",
              postId,
              senderId: liker._id.toString(),
              time: Time,
            },
          });
        }
      } catch (err) {
        console.error("LikeNotiToUploader error:", err.message);
      }
    });

    // === COMMENT NOTIFICATION
    socket.on("CommentNotiToUploader", async ({ Time, postId, senderId }) => {
      try {
        const commenter = await User.findById(userId);
        const postOwner = await User.findById(senderId);
        if (!commenter || !postOwner) return;

        postOwner.Notifications.push({
          NotificationSender: commenter._id,
          NotificationType: "post",
          NotificationText: `${commenter.firstName} ${commenter.LastName} commented on your post`,
          Time,
          postId,
        });
        await postOwner.save();

        if (postOwner.SocketId) {
          io.to(postOwner.SocketId).emit("Receive-Noti", {
            text: `${commenter.firstName} ${commenter.LastName} commented on your post`,
          });
          io.to(postOwner.SocketId).emit("getHomeBadge", { text: "ok" });
        }

        if (postOwner.FcmId) {
          await admin.messaging().send({
            token: postOwner.FcmId,
            notification: {
              title: "New Comment!",
              body: `${commenter.firstName} ${commenter.LastName} commented on your post`,
              imageUrl: commenter.Images?.profile,
              icon: "https://i.ibb.co/j6qShGt/CC.png",
            },
            data: {
              type: "comment",
              postId,
              senderId: commenter._id.toString(),
              time: Time,
            },
          });
        }
      } catch (err) {
        console.error("CommentNotiToUploader error:", err.message);
      }
    });

    // === HANDLE DISCONNECT
    socket.on("disconnect", async () => {
      try {
        await User.findByIdAndUpdate(userId, { $unset: { SocketId: "" } });
        console.log(`User ${userId} disconnected`);
      } catch (err) {
        console.error("Error during disconnect:", err.message);
      }
    });
  });
};

module.exports = initializeSocket;

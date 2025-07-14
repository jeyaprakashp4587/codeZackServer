const cron = require("node-cron");
const moment = require("moment-timezone");
const User = require("./models/User");
const initializeFirebaseAdmin = require("../firebase/firebaseAdmin");
const admin = initializeFirebaseAdmin();

// Run cron job every day at 12:00 AM
cron.schedule("59 23 * * 0", async () => {
  const now = moment().tz("Asia/Kolkata");

  try {
    const topUsers = await User.aggregate([
      {
        $match: {
          Challenges: { $exists: true, $not: { $size: 0 } },
        },
      },
      {
        $project: {
          Name: 1,
          FcmId: 1,
          TotalVotes: {
            $sum: {
              $map: {
                input: "$Post",
                as: "post",
                in: "$$post.PostVote",
              },
            },
          },
        },
      },
      { $sort: { TotalVotes: -1 } },
      { $limit: 10 },
    ]);

    const rewards = [500, 300, 200];

    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      const coins = i < 3 ? rewards[i] : 50;

      await User.updateOne({ _id: user._id }, { $inc: { Coins: coins } });

      if (user.FcmId) {
        const message = {
          notification: {
            title: `🎉 Congrats ${user.Name}!`,
            body: `You ranked #${i + 1} and earned ${coins} coins!`,
          },
          token: user.FcmId,
          android: {
            notification: { icon: "https://i.ibb.co/j6qShGt/CC.png" },
          },
        };
        await admin.messaging().send(message);
        console.log(`📢 Push sent to ${user.Name}`);
      }
    }

    // Reset all post votes
    await User.updateMany({}, { $set: { "Post.$[].PostVote": 0 } });
    console.log("✅ Weekly job completed and votes reset at", now.format());
  } catch (err) {
    console.error("❌ Weekly job failed:", err);
  }
});

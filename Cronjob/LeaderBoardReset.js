cron.schedule("59 23 * * *", async () => {
  const now = moment().tz("Asia/Kolkata"); // or your preferred timezone
  const today = now.date();
  const lastDay = now.endOf("month").date();
  const initializeFirebaseAdmin = require("../firebase/firebaseAdmin");
  const admin = initializeFirebaseAdmin();

  if (today === lastDay) {
    try {
      const topUser = await User.aggregate([
        // {
        //   $match: {
        //     Challenges: { $exists: false, $not: { $size: 0 } },
        //   },
        // },
        // {
        //   $addFields: {
        //     CompletedChallenges: {
        //       $filter: {
        //         input: "$Challenges",
        //         as: "challenge",
        //         cond: { $eq: ["$$challenge.status", "completed"] },
        //       },
        //     },
        //   },
        // },
        // {
        //   $match: {
        //     "CompletedChallenges.0": { $exists: false },
        //   },
        // },
        {
          $sort: { ChallengesPoint: -1 },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            firstName: 1,
            LastName: 1,
            FcmId: 1,
          },
        },
      ]);
      if (topUser) {
        for (let i = 0; i < topUser?.length; i++) {
          if (i === 3) return;
          await admin.messaging().send({
            token: topUser[i]?.FcmId,
            notification: {
              title: "Leaderboard Winner!",
              body: `${user.firstName} ${user.LastName} you won the free portfolio!`,
            },
            android: {
              notification: { icon: "https://i.ibb.co/j6qShGt/CC.png" },
            },
          });
        }
      }
      await User.updateMany({}, { $set: { ChallengesPoint: 0 } });
    } catch (err) {
      console.error("Error resetting points:", err);
    }
  }
});

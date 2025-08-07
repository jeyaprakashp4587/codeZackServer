cron.schedule("59 23 * * *", async () => {
  const now = moment().tz("Asia/Kolkata"); // or your preferred timezone
  const today = now.date();
  const lastDay = now.endOf("month").date();
  const initializeFirebaseAdmin = require("../firebase/firebaseAdmin");
  const admin = initializeFirebaseAdmin();
  const nodemailer = require("nodemailer");
  require("dotenv").config();

  if (today === lastDay) {
    try {
      const transporter = nodemailer.createTransport({});
      const topUser = await User.aggregate([
        // {
        //   $match: {
        //     Challenges: { $exists: false, $not: { $size: 0 } }, //
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
            Email: 1,
          },
        },
      ]);
      if (topUser) {
        for (let i = 0; i < topUser?.length; i++) {
          if (i === 3) return;
          // send reward link to winners
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
          // Send notification to winnners
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

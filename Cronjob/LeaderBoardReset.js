cron.schedule("59 23 * * *", async () => {
  const moment = require("moment-timezone");
  const now = moment().tz("Asia/Kolkata");
  const today = now.date();
  const lastDay = now.endOf("month").date();

  if (today === lastDay) {
    try {
      const initializeFirebaseAdmin = require("../firebase/firebaseAdmin");
      const admin = initializeFirebaseAdmin();

      const nodemailer = require("nodemailer");
      require("dotenv").config();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const topUser = await User.aggregate([
        // Uncomment below blocks if needed
        // {
        //   $match: {
        //     Challenges: { $exists: true, $not: { $size: 0 } },
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
        //     "CompletedChallenges.0": { $exists: true },
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

      if (topUser?.length) {
        const downloadLink = "https://yourhost.com/files/portfolio.zip";

        for (let i = 0; i < topUser.length; i++) {
          if (i === 3) break;

          const user = topUser[i];

          try {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: user.Email,
              subject: "🏆 Get Your CodeZack Reward!",
              html: `
              <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
                <table style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 10px; overflow: hidden;">
                  <tr>
                    <td style="background-color: #181818; padding: 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0;">🏆 Leaderboard Winner</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px;">
                      <h2 style="color: #333;">Hey ${user.firstName},</h2>
                      <p style="font-size: 16px; color: #555;">
                        Congrats on topping the leaderboard on <strong>CodeZack</strong>! You absolutely crushed it 🔥
                      </p>
                      <p style="font-size: 16px; color: #555;">
                        As your reward, here’s your exclusive portfolio template with all the assets. Click the button below to download it:
                      </p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${downloadLink}" target="_blank" style="background-color: #003399; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-size: 16px;">
                          ⬇️ Download Portfolio
                        </a>
                      </div>
                      <p style="font-size: 14px; color: #777;">
                        Keep building, keep leveling up 💻<br />
                        – The CodeZack Team 🚀
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f4f4f4; text-align: center; padding: 15px; font-size: 12px; color: #999;">
                      © 2025 CodeZack. All rights reserved.
                    </td>
                  </tr>
                </table>
              </div>
            `,
            });

            // Send FCM notification
            await admin.messaging().send({
              token: user.FcmId,
              notification: {
                title: "Leaderboard Winner!",
                body: `${user.firstName} ${user.LastName}, you won the free portfolio!`,
              },
              android: {
                notification: {
                  icon: "https://i.ibb.co/j6qShGt/CC.png",
                },
              },
            });
          } catch (error) {
            console.error(`❌ Failed to send reward to ${user.Email}:`, error);
          }
        }
      }

      // Reset all user points
      await User.updateMany({}, { $set: { ChallengesPoint: 0 } });
      console.log("✅ Points reset and top users rewarded.");
    } catch (err) {
      console.error("❌ Error during leaderboard job:", err);
    }
  }
});

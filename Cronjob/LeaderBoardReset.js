cron.schedule("59 23 * * *", async () => {
  const now = moment().tz("Asia/Kolkata"); // or your preferred timezone
  const today = now.date();
  const lastDay = now.endOf("month").date();

  if (today === lastDay) {
    try {
      await User.updateMany({}, { $set: { ChallengesPoint: 0 } });
    } catch (err) {
      console.error("Error resetting points:", err);
    }
  }
});

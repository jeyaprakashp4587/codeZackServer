const cron = require("node-cron");
const moment = require("moment-timezone");
const User = require("./models/User");
const initializeFirebaseAdmin = require("../firebase/firebaseAdmin");
const admin = initializeFirebaseAdmin();

// Run cron job every day at 12:00 AM
cron.schedule("59 23 * * 0", async () => {
  try {
  } catch (err) {
    console.error("❌ Weekly job failed:", err);
  }
});

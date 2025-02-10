const admin = require("firebase-admin");
// Custom function to initialize Firebase Admin SDK fgr
const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(
        require("../loanbuddy-aa9c3-firebase-adminsdk-w6b3p-f3f477730e.json")
      ),
    });
    console.log("Firebase Admin SDK initialized");
  } else {
    console.log("Firebase Admin SDK already initialized");
  }

  return admin;
};

module.exports = initializeFirebaseAdmin;

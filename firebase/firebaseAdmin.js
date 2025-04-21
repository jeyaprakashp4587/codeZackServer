const admin = require("firebase-admin");
require("dotenv").config();
// Custom function to initialize Firebase Admin SDK fgr
const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log("Firebase Admin SDK initialized");
  } else {
    console.log("Firebase Admin SDK already initialized");
  }

  return admin;
};

module.exports = initializeFirebaseAdmin;

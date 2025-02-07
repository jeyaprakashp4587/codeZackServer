const admin = require("firebase-admin");

const getJson = async () => {
  const res = await fetch("https://jsonkeeper.com/b/IOKP");
  if (res) {
    const service = res.json();
    return service;
  }
};
// Custom function to initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(
        require("../loanbuddy-aa9c3-firebase-adminsdk-w6b3p-857465bb2d.json")
      ),
    });
    console.log("Firebase Admin SDK initialized");
  } else {
    console.log("Firebase Admin SDK already initialized");
  }

  return admin;
};

module.exports = initializeFirebaseAdmin;
// git commit -m "first commit"
// git branch -M main
// git remote add origin https://github.com/jeyaprakashp4587/czServer.git
// git push -u origin main

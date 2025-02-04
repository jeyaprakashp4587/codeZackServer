const admin = require('firebase-admin');

// Load the service account key JSON
const serviceAccount = require('../loanbuddy-aa9c3-firebase-adminsdk-w6b3p-857465bb2d.json');

// Custom function to initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized');
  } else {
    console.log('Firebase Admin SDK already initialized');
  }

  return admin;
};

module.exports = initializeFirebaseAdmin;

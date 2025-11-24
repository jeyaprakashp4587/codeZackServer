const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");

// Routes
router.post("/splash", loginController.splash);
router.post("/signIn", loginController.signIn);
router.post("/verifyEmail", loginController.verifyEmail);
router.post("/signUp", loginController.signUp);
router.post("/signOut/:id", loginController.signOut);
router.post("/getUser", loginController.getUser);
router.post("/sendResetPassOtp", loginController.sendResetPassOtp);
router.post("/resetNewPassword", loginController.resetNewPassword);

module.exports = router;

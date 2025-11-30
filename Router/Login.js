import express from "express";
const router = express.Router();
import * as loginController from "../controllers/loginController.js";

// Routes (all paths are lowercase)
router.post("/login", loginController.signIn);
router.post("/verify-email", loginController.verifyEmail);
router.post("/register", loginController.signUp);
router.post("/logout/:id", loginController.signOut);
router.get("/user/:userId", loginController.getUser);
router.post("/send-reset-pass-otp", loginController.sendResetPassOtp);
router.post("/reset-password", loginController.resetNewPassword);
router.post("/refresh", loginController.refreshToken);

export default router;

import express from "express";
const router = express.Router();
import * as profileController from "../controllers/profileController.js";
import { verifyToken } from "../middleware/JWT.js";

// Routes (lowercase paths)
router.use(verifyToken);
router.post("/updateprofileimages", profileController.updateProfileImages);
router.post("/updateprofiledata/:id", profileController.updateProfileData);
router.post("/savefcmtoken", profileController.saveFcmToken);
router.post("/setonlinestatus/:id", profileController.setOnlineStatus);
router.get("/getlatest-version", profileController.getLatestVersion);

export default router;

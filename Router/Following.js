import express from "express";
const router = express.Router();
import * as followingController from "../controllers/followingController.js";
import { verifyToken } from "../middleware/JWT.js";

// Routes (lowercase paths)
router.use(verifyToken);
router.post("/findexistsconnection", followingController.findExistsConnection);
router.post("/addconnection", followingController.addConnection);
router.post("/removeconnection/:id", followingController.removeConnection);
router.post("/getmutuals", followingController.getMutuals);
router.get("/getnetworks/:id", followingController.getNetworks);

export default router;

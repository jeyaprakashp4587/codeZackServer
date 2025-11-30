import express from "express";
const router = express.Router();
import * as challengesController from "../controllers/challengesController.js";
import { verifyToken } from "../middleware/JWT.js";

// Routes (lowercase paths)
router.use(verifyToken);
router.post("/addchallenge", challengesController.addChallenge);
router.post("/uploadchallenge/:id", challengesController.uploadChallenge);
router.post("/getchallenges", challengesController.getChallenges);
router.post("/getuserchallenge/:id", challengesController.getUserChallenge);
router.post(
  "/getchallengeandstatus/:id",
  challengesController.getChallengeAndStatus
);
router.get(
  "/getcompletedchallenge/:id/:challengeName",
  challengesController.getCompletedChallenge
);
router.get("/getalltutorials", challengesController.getAllTutorials);
router.get("/getallprojects", challengesController.getAllProjects);

export default router;

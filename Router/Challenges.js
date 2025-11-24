const express = require("express");
const router = express.Router();
const challengesController = require("../controllers/challengesController");

// Routes
router.post("/addChallenge", challengesController.addChallenge);
router.post("/uploadChallenge/:id", challengesController.uploadChallenge);
router.post("/getChallenges", challengesController.getChallenges);
router.post("/getUserChallenge/:id", challengesController.getUserChallenge);
router.post("/getChallengeAndStatus/:id", challengesController.getChallengeAndStatus);
router.get("/getCompletedChallenge/:id/:challengeName", challengesController.getCompletedChallenge);
router.get("/getAllTutorials", challengesController.getAllTutorials);
router.get("/getAllProjects", challengesController.getAllProjects);

module.exports = router;

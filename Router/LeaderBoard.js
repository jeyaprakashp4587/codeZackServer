const express = require("express");
const router = express.Router();
const leaderBoardController = require("../controllers/leaderBoardController");

// Routes
router.get("/getLeaderBoard", leaderBoardController.getLeaderBoard);

module.exports = router;

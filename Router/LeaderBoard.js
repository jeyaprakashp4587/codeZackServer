const express = require("express");
const router = express.Router();
const User = require("../Models/User");

router.get("/getLeaderBoard", async (req, res) => {
  try {
    const topUser = await User.aggregate([
      {
        $match: {
          Challenges: {
            $exists: true,
            $not: { $size: 0 },
          },
        },
      },
      {
        $addFields: {
          CompletedChallenges: {
            $filter: {
              input: "$Challenges",
              as: "challenge",
              cond: { $eq: ["$$challenge.status", "completed"] },
            },
          },
        },
      },
      {
        $match: {
          "CompletedChallenges.0": { $exists: true },
        },
      },
      {
        $addFields: {
          CompletedChallengesCount: { $size: "$CompletedChallenges" },
        },
      },
      {
        $sort: { CompletedChallengesCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    console.log(topUser);
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;

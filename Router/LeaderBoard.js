const express = require("express");
const router = express.Router();
const User = require("../Models/User");

router.get("/getLeaderBoard", async (req, res) => {
  try {
    console.log("check");

    const topUser = await User.aggregate([
      {
        $match: {
          Challenges: { $exists: true, $not: { $size: 0 } },
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
        $sort: { ChallengesPoint: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          firstName: 1,
          LastName: 1,
          ChallengesPoint: 1,
          profile: "$Images.profile",
        },
      },
    ]);

    console.log("top user", topUser);
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;

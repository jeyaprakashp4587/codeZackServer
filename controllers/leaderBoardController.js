const User = require("../Models/User");

// Get leaderboard
const getLeaderBoard = async (req, res) => {
  try {
    const topUser = await User.aggregate([
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
          _id: 1,
        },
      },
    ]);
    if (topUser) {
      res.status(200).json({ users: topUser });
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  getLeaderBoard,
};


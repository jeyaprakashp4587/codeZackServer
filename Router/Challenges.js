const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const { DB1 } = require("../Database/CCDB");

// Add a new challenge for a user
router.post("/addChallenge", async (req, res) => {
  const {
    userId,
    ChallengeName,
    ChallengeType,
    ChallengeImage,
    ChallengeLevel,
  } = req.body;

  // Determine ChallengeType
  let ChType;
  switch (ChallengeType) {
    case "HTML":
      ChType = "Web Development";
      break;
    case "Swift":
    case "React Native":
    case "Kotlin":
      ChType = "App Development";
      break;
    default:
      ChType = null;
  }

  if (!ChType) return res.status(400).send("Invalid ChallengeType");

  try {
    // Add challenge only if not already present
    const result = await User.findOneAndUpdate(
      {
        _id: userId,
        "Challenges.ChallengeName": { $ne: ChallengeName },
      },
      {
        $push: {
          Challenges: {
            ChallengeName,
            status: "pending",
            ChallengeType: ChType,
            ChallengeImage,
            ChallengeLevel,
          },
        },
      },
      { new: true }
    );

    if (result) {
      res.status(200).send("Challenge added successfully");
    } else {
      // Either user not found or challenge already exists
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        res.status(404).send("User not found");
      } else {
        res.status(400).send("Challenge already exists");
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
// Upload a completed challenge
router.post("/uploadChallenge/:id", async (req, res) => {
  const { GitRepo, LiveLink, SnapImage, ChallengeName, level } = req.body;
  const { id } = req.params;

  try {
    let point;
    const lowerLevel = level.toLowerCase();
    switch (lowerLevel) {
      case "newbie":
        point = 10;
        break;
      case "junior":
        point = 20;
        break;

      case "expert":
        point = 30;
        break;

      case "legend":
        point = 40;
        break;

      default:
        point = 0;
        break;
    }
    if (point) {
      console.log(point);

      // return;
      const result = await User.updateOne(
        { _id: id, "Challenges.ChallengeName": ChallengeName },
        {
          $set: {
            "Challenges.$.RepoLink": GitRepo,
            "Challenges.$.SnapImage": SnapImage,
            "Challenges.$.LiveLink": LiveLink,
            "Challenges.$.status": "completed",
          },
          $inc: { ChallengesPoint: point },
        }
      );
      if (result.modifiedCount === 0) {
        return res.status(404).send("User or Challenge not found");
      }
    }
    res.send("completed");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Get all challenges from the app database
router.post("/getChallenges", async (req, res) => {
  try {
    const { ChallengeTopic } = req.body;
    const Collection = DB1.collection("Challenges");
    const findChallengeTopic = await Collection.findOne({ ChallengeTopic });
    if (findChallengeTopic) {
      res.send(findChallengeTopic.Challenges);
    } else {
      res.status(404).send("No challenges found for this topic");
    }
  } catch (error) {
    res.status(500).send("An error occurred while processing your request.");
  }
});

// Get challenges for a user based on status
router.post("/getUserChallenge/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { option } = req.body;

    if (!["All", "Complete", "Pending"].includes(option)) {
      return res.status(400).send("Invalid option");
    }
    // Only fetch the Challenges field (not the whole user)
    const user = await User.findById(id).select("Challenges");
    if (!user) {
      return res.status(404).send("User not found");
    }
    let challenges = user.Challenges || [];
    if (option === "Complete") {
      challenges = challenges.filter((ch) => ch.status === "completed");
    } else if (option === "Pending") {
      challenges = challenges.filter((ch) => ch.status === "pending");
    }
    return res.status(200).json(challenges);
  } catch (error) {
    console.error("Error in /getUserChallenge:", error);
    return res.status(500).send("Internal Server Error");
  }
});

router.post("/getChallengeAndStatus/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ChallengeName, ChallengeType, ChallengeLevel } = req.body;

    if (!ChallengeName || !ChallengeType || !ChallengeLevel) {
      return res.status(400).send("Missing required fields");
    }

    // ✅ Get user status
    const user = await User.findById(id);
    let challengeStatus = null;

    if (user) {
      const findChallenge = user?.Challenges.find(
        (ch) => ch.ChallengeName === ChallengeName
      );
      if (findChallenge) {
        challengeStatus = findChallenge.status; // 'pending' or 'completed'
      }
    }

    // ✅ Get the actual challenge details
    const collection = DB1.collection("Challenges");
    const topicDoc = await collection.findOne({
      ChallengeTopic: ChallengeType,
    });

    if (!topicDoc) {
      return res.status(404).send("Challenge topic not found");
    }

    const levelKey = ChallengeLevel.toLowerCase() + "Level";
    const challengeArray = topicDoc?.Challenges?.[levelKey];

    if (!Array.isArray(challengeArray)) {
      return res.status(400).send("Invalid challenge level");
    }

    const foundChallenge = challengeArray.find(
      (ch) => ch.title === ChallengeName
    );

    if (!foundChallenge) {
      return res.status(404).send("Challenge not found");
    }

    // ✅ Send both challenge data & user status
    return res.status(200).json({
      challenge: foundChallenge,
      status: challengeStatus, // can be null, 'pending', or 'completed'
    });
  } catch (error) {
    console.error("Error in getChallengeAndStatus:", error);
    return res.status(500).send("Internal Server Error");
  }
});

//
router.get("/getCompletedChallenge/:id/:challengeName", async (req, res) => {
  const { id, challengeName } = req.params;
  // find user
  const user = await User.findById(id);
  if (user) {
    const challenge = user.Challenges.find(
      (item) => item.ChallengeName == challengeName
    );
    if (challenge) res.send(challenge);
  }
});
// this is for get video tutorials
router.get("/getAllTutorials", async (req, res) => {
  try {
    const tutorials = DB1.collection("Videos");
    const cursor = await tutorials.find({}).toArray();
    if (cursor.length > 0) {
      res.status(200).json({ tutorials: cursor });
    } else {
      res.status(404).json({ message: "No tutorials found." });
    }
  } catch (error) {
    res.status(504);
  }
});
// get all premium projects
router.get("/getAllProjects", async (req, res) => {
  const page = parseInt(req.query.page || "0"); // default to 0
  const limit = parseInt(req.query.limit || "3"); // default to 3
  const skip = page * limit;

  try {
    const projectsCollection = DB1.collection("Projects");

    // Assuming only one document that holds the array
    const doc = await projectsCollection.findOne({});

    if (doc && Array.isArray(doc.Projects)) {
      const slicedData = doc.Projects.slice(skip, limit);
      res.status(200).json({ projects: slicedData });
    } else {
      res.status(404).json({ message: "No Projects found" });
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

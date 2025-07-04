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
  const user = await User.findById(userId);
  if (user) {
    // Check if challenge already exists for user
    const existsChallenge = user.Challenges.some(
      (ch) => ch.ChallengeName === ChallengeName
    );
    if (!existsChallenge) {
      user.Challenges.push({
        ChallengeName,
        status: "pending",
        ChallengeType: ChType,
        ChallengeImage,
        ChallengeLevel,
      });
      await user.save();
      res.send("Challenge added successfully");
    } else {
      res.status(400).send("Challenge already exists");
    }
  } else {
    res.status(404).send("User not found");
  }
});

// Upload a completed challenge
router.post("/uploadChallenge/:id", async (req, res) => {
  const { GitRepo, LiveLink, SnapImage, ChallengeName } = req.body;
  const { id } = req.params;

  const user = await User.findById(id);
  if (user) {
    const findChallenge = user.Challenges.find(
      (ch) => ch.ChallengeName === ChallengeName
    );
    if (findChallenge) {
      findChallenge.RepoLink = GitRepo;
      findChallenge.SnapImage = SnapImage;
      findChallenge.LiveLink = LiveLink;
      findChallenge.status = "completed";
      await user.save();
      res.send("completed");
    } else {
      res.status(404).send("Challenge not found");
    }
  } else {
    res.status(404).send("User not found");
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
  const { id } = req.params;
  const { option } = req.body;

  const user = await User.findById(id);
  if (user) {
    let challenges;
    switch (option) {
      case "All":
        challenges = user.Challenges;
        break;
      case "Complete":
        challenges = user.Challenges.filter((ch) => ch.status === "completed");
        break;
      case "Pending":
        challenges = user.Challenges.filter((ch) => ch.status === "pending");
        break;
      default:
        return res.status(400).send("Invalid option");
    }
    res.send(challenges);
  } else {
    res.status(404).send("User not found");
  }
});

// Check the status of a specific challenge
router.post("/checkChallengeStatus/:id", async (req, res) => {
  const { ChallengeName } = req.body;
  const { id } = req.params;

  const user = await User.findById(id);
  if (user) {
    const findChallenge = user?.Challenges.find(
      (ch) => ch.ChallengeName == ChallengeName
    );

    switch (findChallenge?.status) {
      case "pending":
        res.send("pending");
        break;
      case "completed":
        res.send("completed");
        break;
    }
  }
});

// Get a particular challenge by its name, type, and level
router.post("/getParticularChallenge/:id", async (req, res) => {
  const { id } = req.params;
  const { ChallengeName, ChallengeType, ChallengeLevel } = req.body;
  const collection = DB1.collection("Challenges");
  const findTopic = await collection.findOne({ ChallengeTopic: ChallengeType });
  if (findTopic) {
    let findChallenge;
    switch (ChallengeLevel.toLowerCase()) {
      case "newbie":
        findChallenge = findTopic?.Challenges.newbieLevel.find(
          (ch) => ch.title == ChallengeName
        );
        break;
      case "junior":
        findChallenge = findTopic?.Challenges.juniorLevel.find(
          (ch) => ch.title == ChallengeName
        );
        break;
      case "expert":
        findChallenge = findTopic?.Challenges.expertLevel.find(
          (ch) => ch.title == ChallengeName
        );
        break;
      case "legend":
        findChallenge = findTopic?.Challenges.legendLevel.find(
          (ch) => ch.title == ChallengeName
        );
        break;
      default:
        return res.status(400).send("Invalid challenge level");
    }

    res.status(200).json({ challenge: findChallenge });
  } else {
    res.status(404).send("Challenge topic not found");
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
router.get("/getAllProjects", async (_, res) => {
  try {
    const projectsCollection = DB1.collection("Projects");
    const cursor = await projectsCollection.find({}).toArray();
    if (cursor.length > 0) {
      res.status(200).json({ projects: cursor });
    } else {
      res.status(404).json({ message: "No Projects found" });
    }
  } catch (error) {}
});

module.exports = router;

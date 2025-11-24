const User = require("../Models/User");
const { DB1 } = require("../Database/CCDB");

// Add challenge
const addChallenge = async (req, res) => {
  const {
    userId,
    ChallengeName,
    ChallengeType,
    ChallengeImage,
    ChallengeLevel,
  } = req.body;

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
};

// Upload challenge
const uploadChallenge = async (req, res) => {
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
};

// Get challenges
const getChallenges = async (req, res) => {
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
};

// Get user challenge
const getUserChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { option } = req.body;

    if (!["All", "Complete", "Pending"].includes(option)) {
      return res.status(400).send("Invalid option");
    }
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
};

// Get challenge and status
const getChallengeAndStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { ChallengeName, ChallengeType, ChallengeLevel } = req.body;

    if (!ChallengeName || !ChallengeType || !ChallengeLevel) {
      return res.status(400).send("Missing required fields");
    }

    const user = await User.findById(id);
    let challengeStatus = null;

    if (user) {
      const findChallenge = user?.Challenges.find(
        (ch) => ch.ChallengeName === ChallengeName
      );
      if (findChallenge) {
        challengeStatus = findChallenge.status;
      }
    }

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

    return res.status(200).json({
      challenge: foundChallenge,
      status: challengeStatus,
    });
  } catch (error) {
    console.error("Error in getChallengeAndStatus:", error);
    return res.status(500).send("Internal Server Error");
  }
};

// Get completed challenge
const getCompletedChallenge = async (req, res) => {
  const { id, challengeName } = req.params;
  const user = await User.findById(id);
  if (user) {
    const challenge = user.Challenges.find(
      (item) => item.ChallengeName == challengeName
    );
    if (challenge) res.send(challenge);
  }
};

// Get all tutorials
const getAllTutorials = async (req, res) => {
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
};

// Get all projects
const getAllProjects = async (req, res) => {
  const page = parseInt(req.query.page || "0");
  const limit = parseInt(req.query.limit || "3");
  const skip = page * limit;

  try {
    const projectsCollection = DB1.collection("Projects");

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
};

module.exports = {
  addChallenge,
  uploadChallenge,
  getChallenges,
  getUserChallenge,
  getChallengeAndStatus,
  getCompletedChallenge,
  getAllTutorials,
  getAllProjects,
};


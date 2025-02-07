const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const { DB1 } = require("../Database/CCDB");

// Get assignments by type
router.get("/getAssignments/:assignmentType", async (req, res) => {
  const { assignmentType } = req.params;

  try {
    const collection = DB1.collection("Quiz");

    // Find the assignment by type
    const findAssignment = await collection.findOne(
      { AssignmentType: assignmentType },
      { projection: { Quiz: 1 } } // Fetch only the Quiz field
    );

    if (findAssignment) {
      res.send(findAssignment.Quiz);
    } else {
      res.status(404).json({ message: "Assignment type not found" });
    }
  } catch (error) {
    console.error("Error while fetching assignments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Save the assignment
router.post("/saveAssignment/:id", async (req, res) => {
  const { id } = req.params;
  const { AssignmentType, point, level } = req.body;
  console.log(AssignmentType, point, level);

  try {
    // Step 1: Ensure the Assignments array is initialized
    const user = await User.findOneAndUpdate(
      { _id: id },
      { $setOnInsert: { Assignments: [] } }, // Initialize assignments array if the user doesn't exist
      { upsert: true, new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Update or add the assignment
    const update = {
      $addToSet: {
        "Assignments.$[assignment].AssignmentLevel": {
          LevelType: level,
          point,
        },
      },
    };

    const options = {
      arrayFilters: [{ "assignment.AssignmentType": AssignmentType }],
      new: true,
    };

    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      update,
      options
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found during update" });
    }

    // Step 3: Increment course points
    const courseUpdate = {
      $inc: {
        "Courses.$[course].Technologies.$[tech].Points":
          level.toLowerCase() === "easy"
            ? 2
            : level.toLowerCase() === "medium"
            ? 3
            : level.toLowerCase() === "hard"
            ? 5
            : 0,
      },
    };

    const courseOptions = {
      arrayFilters: [
        {
          "course.Technologies.TechName": {
            $regex: AssignmentType,
            $options: "i",
          },
        },
        { "tech.TechName": { $regex: AssignmentType, $options: "i" } },
      ],
    };

    await User.updateOne({ _id: id }, courseUpdate, courseOptions);

    // Step 4: Fetch the updated assignments for the response
    const finalUser = await User.findById(id, "Assignments");
    res.status(200).json({ Assignments: finalUser.Assignments });
  } catch (error) {
    console.error("Server error while saving assignment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// get user assignments
router.get("/getUserAssignments/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    // console.log(userId);

    // Fetch the user by ID
    const user = await User.findById(userId).select("Assignments");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // console.log(user?.Assignments);

    // Respond with assignments
    res.status(200).json({ Assignments: user.Assignments });
  } catch (error) {
    console.error("Error fetching user assignments:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// s
module.exports = router;

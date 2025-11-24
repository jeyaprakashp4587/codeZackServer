const User = require("../Models/User");
const { DB1 } = require("../Database/CCDB");

// Get assignments
const getAssignments = async (req, res) => {
  const { assignmentType } = req.params;

  try {
    const collection = DB1.collection("Quiz");

    const findAssignment = await collection.findOne(
      { AssignmentType: assignmentType },
      { projection: { Quiz: 1 } }
    );

    if (findAssignment) {
      res.send(findAssignment.Quiz);
    } else {
      res.status(404).json({ message: "Assignment type not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Save assignment
const saveAssignment = async (req, res) => {
  const { id } = req.params;
  const { AssignmentType, point, level } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { _id: id },
      { $setOnInsert: { Assignments: [] } },
      { upsert: true, new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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

    const finalUser = await User.findById(id, "Assignments");
    res.status(200).json({ Assignments: finalUser.Assignments });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get user assignments
const getUserAssignments = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("Assignments");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ Assignments: user.Assignments });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAssignments,
  saveAssignment,
  getUserAssignments,
};


const User = require("../Models/User");

// Set activity
const setActivity = async (req, res) => {
  const { ActivityName, Date } = req.body;
  const { id } = req.params;
  try {
    const user = await User.findOne({ _id: id, "Activities.date": Date });
    if (user) {
      const result = await User.updateOne(
        { _id: id, "Activities.date": Date },
        {
          $push: { "Activities.$.activities": { activityName: ActivityName } },
        }
      );
      if (result.modifiedCount > 0) {
        res.send("Activity updated successfully");
      } else {
        res.status(400).send("Failed to update activity");
      }
    } else {
      const result = await User.updateOne(
        { _id: id },
        {
          $push: {
            Activities: {
              date: Date,
              activities: [{ activityName: ActivityName }],
            },
          },
        }
      );
      if (result.modifiedCount > 0) {
        res.send("Activity added successfully");
      } else {
        res.status(400).send("Failed to add activity");
      }
    }
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
};

// Get all activity dates
const getAllActivityDates = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id, "Activities.date");
    if (user) {
      const dates = user.Activities.map((activity) => activity.date);
      res.send(dates);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
};

// Get particular date activities
const getParticularDateActivities = async (req, res) => {
  const { id } = req.params;
  const { Date } = req.body;

  try {
    const user = await User.findOne(
      { _id: id, "Activities.date": Date },
      { "Activities.$": 1 }
    );

    if (user && user.Activities.length > 0) {
      res.send(user.Activities[0].activities);
    } else {
      res.status(404).send("No activities found for this date");
    }
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
};

module.exports = {
  setActivity,
  getAllActivityDates,
  getParticularDateActivities,
};


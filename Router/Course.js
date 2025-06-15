const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const { DB1 } = require("../Database/CCDB");

//get all courses from codezack Db
router.get("/getAllCourses", async (req, res) => {
  try {
    const collection = DB1.collection("Courses");
    const courses = await collection.find().toArray();
    if (courses.length === 0) {
      return res.status(404).json({ message: "No courses found" });
    }
    return res.status(200).json({ Course: courses[0]?.courses });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
// Add Course
router.post("/addCourse", async (req, res) => {
  const { courseName, userId } = req.body;

  try {
    await User.updateMany(
      {},
      {
        $set: {
          "Courses.$[].Technologies.$[].currentTopic": 0,
          "Courses.$[].Technologies.$[].currentLevel": "begineer",
        },
      }
    );
    // Find the user by ID
    const existsCourse = await User.findOne({
      _id: userId,
      "Courses.Course_Name": courseName,
    });
    if (existsCourse) {
      return res.send("Enrolled");
    }
    const latestCourse = await User.findByIdAndUpdate(
      { _id: userId },
      {
        $push: {
          Courses: {
            $each: [{ Course_Name: courseName }],
          },
        },
      },
      { new: true }
    );
    return res.status(200).json({ courses: latestCourse.Courses });
  } catch (error) {
    console.error("Error adding course:", error);
    return res.status(500).send("Server error: " + error.message);
  }
});
// get user courses
router.get("/getCourses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id, { Courses: 1, _id: 0 });
    if (user) {
      res.status(200).json({ Courses: user.Courses });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ error: "An error occurred" });
  }
});
// Add Technology to Course
router.post("/addTech", async (req, res) => {
  const { TechName, CourseName, TechIcon, TechWeb, UserId } = req.body;
  try {
    // 1️⃣ Check if the tech already exists
    const exists = await User.findOne({
      _id: UserId,
      "Courses.Course_Name": CourseName,
      "Courses.Technologies.TechName": TechName,
    });

    if (exists) {
      return res.send("Enrolled"); // Already added
    }

    // 2️⃣ Push the new tech
    const updateResult = await User.findOneAndUpdate(
      {
        _id: UserId,
        "Courses.Course_Name": CourseName,
      },
      {
        $push: {
          "Courses.$.Technologies": {
            TechName,
            Points: 0,
            TechIcon,
          },
        },
      },
      { new: true, projection: { Courses: 1 } }
    );
    if (updateResult.modifiedCount === 0) {
      return res.status(404).send("User or Course not found.");
    }
    return res.status(200).json({ Tech: updateResult.Courses });
  } catch (error) {
    return res.status(500).send("Server error: " + error.message);
  }
});
// Remove Course
router.post("/removeCourse", async (req, res) => {
  const { userId, CourseName } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Find the course index
    const courseIndex = user.Courses.findIndex(
      (course) => course.Course_Name === CourseName
    );
    if (courseIndex === -1) {
      return res.status(404).send("Course not found.");
    }

    // Remove the course and save
    user.Courses.splice(courseIndex, 1);
    await user.save();

    return res.status(200).json({ course: user.Courses });
  } catch (error) {
    return res.status(500).send("Server error: " + error.message);
  }
});
// get Tech Course Data
router.get("/getTechCourse", async (req, res) => {
  const { TechName, level } = req.query;
  try {
    const collection = DB1.collection("CourseData");
    const CourseData = await collection.findOne(
      { courseName: TechName },
      { projection: { [`courseData.${level}`]: 1, _id: 0 } }
    );
    if (!CourseData) {
      return res.status(404).json({ error: "Course not found" });
    }
    console.log(CourseData);

    res.status(200).json({ courseData: CourseData.courseData[level] });
  } catch (error) {
    console.error("Error fetching course level:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// send the topics length to server for save
router.post("/setTopicLength", async (req, res) => {
  const { Topiclength, userId, TechName } = req.body;
  try {
    const result = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          "Courses.$[course].Technologies.$[tech].currentTopicLength":
            Topiclength,
        },
      },
      {
        arrayFilters: [{ "tech.TechName": TechName }],
        new: true,
      }
    );
    if (!result) {
      return res.status(404).json({ error: "User or tech not found" });
    }
    res.status(200).json({ message: "Topic length updated", data: result });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

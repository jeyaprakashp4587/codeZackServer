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
    console.error("Error retrieving courses:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add Course
router.post("/addCourse", async (req, res) => {
  const { courseName, userId } = req.body;
  console.log();

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Check if the course already exists
    const existsCourse = user.Courses.some(
      (course) => course.Course_Name === courseName
    );
    if (existsCourse) {
      return res.send("Enrolled");
    }

    // Add the course and save
    user.Courses.push({ Course_Name: courseName, Technologies: [] });
    await user.save();

    return res.status(200).json({ courses: user.Courses });
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
    // Find the user by ID
    const user = await User.findById(UserId);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Find the course by name
    const course = user.Courses.find(
      (course) => course.Course_Name === CourseName
    );
    if (!course) {
      return res.status(404).send("Course not found.");
    }

    // Check if the technology already exists in the course
    const existsTech = course.Technologies.some(
      (tech) => tech.TechName === TechName
    );
    if (existsTech) {
      return res.send("Enrolled");
    }

    // Add the technology and save
    course.Technologies.push({
      TechName,
      Points: 0,
      TechIcon: TechIcon,
      TechWeb: TechWeb,
    });
    await user.save();

    return res.status(200).json({ Tech: user.Courses });
  } catch (error) {
    console.error("Error adding technology:", error);
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
    console.error("Error removing course:", error);
    return res.status(500).send("Server error: " + error.message);
  }
});

module.exports = router;

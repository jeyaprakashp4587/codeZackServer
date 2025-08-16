const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const { DB1 } = require("../Database/CCDB");

//get all courses from codezack Db
router.get("/getAllCourses", async (req, res) => {
  try {
    const courses = await DB1.collection("Courses")
      .aggregate([
        {
          $project: {
            _id: 0,
            courses: {
              $map: {
                input: "$courses",
                as: "course",
                in: {
                  name: "$$course.name",
                  img: "$$course.img",
                  technologies: {
                    $map: {
                      input: "$$course.technologies",
                      as: "tech",
                      in: {
                        name: "$$tech.name",
                        icon: "$$tech.icon",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ])
      .toArray();
    // console.log(courses);

    res.status(200).json(courses[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/getParticularCourse", async (req, res) => {
  try {
    const { courseName } = req.query;
    if (!courseName) {
      return res.status(400).json({ error: "Course name is required" });
    }
    const courses = await DB1.collection("Courses").find({}).toArray();
    const course = courses[0]?.courses?.find((c) => c.name === courseName);
    res.status(200).json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Add Course
router.post("/addCourse", async (req, res) => {
  const { courseName, userId } = req.body;

  try {
    // await User.updateMany(
    //   {},
    //   {
    //     $unset: {
    //       "Courses.$[].Technologies.$[].currentLevel": "",
    //     },
    //   }
    // );
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
    const exists = await User.exists({
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
  console.log(TechName, level);
  try {
    const collection = DB1.collection("CourseData");
    const CourseData = await collection.findOne(
      { courseName: TechName },
      { projection: { [`courseData.${level}`]: 1, _id: 0 } }
    );
    if (!CourseData) {
      return res.status(404).json({ error: "Course not found" });
    }
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
        arrayFilters: [
          { "course.Technologies": { $exists: true } }, // filter for 'course'
          { "tech.TechName": TechName }, // filter for 'tech'
        ],
        new: true,
      }
    );
    if (!result) {
      return res.status(404).json({ error: "User or tech not found" });
    }
    let updatedTech = null;
    for (const course of result.Courses) {
      const tech = course.Technologies.find((t) => t.TechName === TechName);
      if (tech) {
        updatedTech = tech;
        break;
      }
    }

    if (!updatedTech)
      return res.status(404).json({ error: "Updated tech not found" });

    res.status(200).json({ updatedTech });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/setTopicLevel", async (req, res) => {
  const { TopicLevel, userId, TechName, TopicLength, TechStatus } = req.body;
  try {
    // dmfm
    const result = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          "Courses.$[course].Technologies.$[tech].TechCurrentLevel": TopicLevel,
          "Courses.$[course].Technologies.$[tech].currentTopicLength":
            TopicLength,
          "Courses.$[course].Technologies.$[tech].TechStatus": TechStatus
            ? "completed"
            : "pending",
        },
      },
      {
        arrayFilters: [
          { "course.Technologies": { $exists: true } },
          { "tech.TechName": TechName },
        ],
        new: true,
      }
    );
    if (!result) {
      return res.status(404).json({ error: "User or tech not found" });
    }
    let updatedTech = null;
    for (const course of result.Courses) {
      const tech = course.Technologies.find((t) => t.TechName === TechName);
      if (tech) {
        updatedTech = tech;
        break;
      }
    }

    if (!updatedTech)
      return res.status(404).json({ error: "Updated tech not found" });

    res.status(200).json({ updatedTech });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/getUserReq", async (req, res) => {
  const { course, challenges, preparation } = req.query;
  try {
    // get Course
    const courseData = await DB1.collection("Courses")
      .aggregate([
        {
          $unwind: "$courses",
        },
        {
          $match: { "courses.name": course },
        },
        {
          $project: {
            _id: 0,
            courseName: "$courses.name",
            techImages: {
              $map: {
                input: "$courses.technologies",
                as: "tech",
                in: "$$tech.icon",
              },
            },
          },
        },
      ])
      .toArray();
    //  get challenge
    const Collection = DB1.collection("Challenges");
    const challengeData = await Collection.aggregate([
      { $unwind: "$Challenges.expertLevel" },
      { $sample: { size: 5 } },
      {
        $project: {
          _id: 0,
          title: "$Challenges.expertLevel.title",
          sample_image: "$Challenges.expertLevel.sample_image",
        },
      },
    ]).toArray();
    // get company
    if (preparation) {
      const companyCollection = DB1.collection("Company");
      const companyData = await companyCollection
        .aggregate([
          { $sample: { size: 1 } },
          { $project: { company_name: 1, companyLogo: 1 } },
        ])
        .toArray();
    }
    if (preparation) {
      res.status(200).json([courseData, challengeData, preparation]);
      return;
    }
    res.status(200).json([courseData, challengeData]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

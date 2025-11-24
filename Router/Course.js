const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");

// Routes
router.get("/getAllCourses", courseController.getAllCourses);
router.get("/getParticularCourse", courseController.getParticularCourse);
router.post("/addCourse", courseController.addCourse);
router.get("/getCourses/:id", courseController.getCourses);
router.post("/addTech", courseController.addTech);
router.post("/removeCourse", courseController.removeCourse);
router.get("/getTechCourse", courseController.getTechCourse);
router.post("/setTopicLength", courseController.setTopicLength);
router.post("/setTopicLevel", courseController.setTopicLevel);
router.get("/getUserReq", courseController.getUserReq);

module.exports = router;

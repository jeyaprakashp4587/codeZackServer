import express from "express";
const router = express.Router();
import * as courseController from "../controllers/courseController.js";
import { verifyToken } from "../middleware/JWT.js";

// Routes (lowercase paths)
router.use(verifyToken);
router.get("/getallcourses", courseController.getAllCourses);
router.get("/getparticularcourse", courseController.getParticularCourse);
router.post("/addcourse", courseController.addCourse);
router.get("/getcourses/:id", courseController.getCourses);
router.post("/addtech", courseController.addTech);
router.post("/removecourse", courseController.removeCourse);
router.get("/gettechcourse", courseController.getTechCourse);
router.post("/settopiclength", courseController.setTopicLength);
router.post("/settopiclevel", courseController.setTopicLevel);
router.get("/getuserreq", courseController.getUserReq);

export default router;

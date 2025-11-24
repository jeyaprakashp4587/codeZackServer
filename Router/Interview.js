const express = require("express");
const router = express.Router();
const interviewController = require("../controllers/interviewController");

// Routes
router.get("/getCompanyDetails", interviewController.getCompanyDetails);
router.post("/getParticularCompany", interviewController.getParticularCompany);
router.post("/addInterView", interviewController.addInterView);
router.post("/setQuestionLength", interviewController.setQuestionLength);
router.post("/submitTask", interviewController.submitTask);

module.exports = router;

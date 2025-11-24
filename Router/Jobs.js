const express = require("express");
const router = express.Router();
const jobsController = require("../controllers/jobsController");

// Routes
router.get("/getAllJobs", jobsController.getAllJobs);
router.post("/postJobs", jobsController.postJobs);

module.exports = router;

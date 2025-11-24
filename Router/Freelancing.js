const express = require("express");
const router = express.Router();
const freelancingController = require("../controllers/freelancingController");

// Routes
router.post("/submitProject", freelancingController.submitProject);
router.get("/getAllProjects", freelancingController.getAllProjects);

module.exports = router;

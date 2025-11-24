const express = require("express");
const router = express.Router();
const assignmentsController = require("../controllers/assignmentsController");

// Routes
router.get("/getAssignments/:assignmentType", assignmentsController.getAssignments);
router.post("/saveAssignment/:id", assignmentsController.saveAssignment);
router.get("/getUserAssignments/:userId", assignmentsController.getUserAssignments);

module.exports = router;

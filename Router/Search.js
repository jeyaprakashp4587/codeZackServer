const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

// Routes
router.post("/getUserName/:id", searchController.getUserName);

module.exports = router;

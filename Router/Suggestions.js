const express = require("express");
const router = express.Router();
const suggestionsController = require("../controllers/suggestionsController");

// Routes
router.get("/users/:id", suggestionsController.getUsers);
router.get("/getAllSuggestions/:id", suggestionsController.getAllSuggestions);

module.exports = router;

import express from "express";
const router = express.Router();
import * as suggestionsController from "../controllers/suggestionsController.js";
import { verifyToken } from "../middleware/JWT.js";

// Routes (lowercase paths)
router.use(verifyToken);
router.get("/users/:id", suggestionsController.getUsers);
router.get("/getallsuggestions/:id", suggestionsController.getAllSuggestions);

export default router;

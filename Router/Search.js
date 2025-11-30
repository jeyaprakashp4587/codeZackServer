import express from "express";
const router = express.Router();
import * as searchController from "../controllers/searchController.js";
import { verifyToken } from "../middleware/JWT.js";

// Routes
router.use(verifyToken);
router.post("/getUserName/:id", searchController.getUserName);

export default router;

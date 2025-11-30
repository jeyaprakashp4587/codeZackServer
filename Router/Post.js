import express from "express";
const router = express.Router();
import * as postController from "../controllers/postController.js";
import { verifyToken } from "../middleware/JWT.js";

// Routes (lowercase paths)
router.use(verifyToken);
router.post("/uploadpost", postController.uploadPost);
router.post("/deletepost/:id", postController.deletePost);
router.get("/getconnectionposts/:userId", postController.getConnectionPosts);
router.post("/getuserposts", postController.getUserPosts);
router.post("/likepost/:postId", postController.likePost);
router.post("/unlikepost/:postId", postController.unlikePost);
router.get("/getlikedusers/:postId", postController.getLikedUsers);
router.post("/commentpost/:postId", postController.commentPost);
router.post("/deletecomment", postController.deleteComment);
router.get("/getcomments/:postId", postController.getComments);
router.get("/getpostdetails/:postId", postController.getPostDetails);

export default router;

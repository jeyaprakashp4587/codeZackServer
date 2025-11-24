const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");

// Routes
router.post("/uploadPost", postController.uploadPost);
router.post("/deletePost/:id", postController.deletePost);
router.get("/getConnectionPosts/:userId", postController.getConnectionPosts);
router.post("/getUserPosts", postController.getUserPosts);
router.post("/likePost/:postId", postController.likePost);
router.post("/unlikePost/:postId", postController.unlikePost);
router.get("/getLikedUsers/:postId", postController.getLikedUsers);
router.post("/commentPost/:postId", postController.commentPost);
router.post("/deleteComment", postController.deleteComment);
router.get("/getComments/:postId", postController.getComments);
router.get("/getPostDetails/:postId", postController.getPostDetails);

module.exports = router;

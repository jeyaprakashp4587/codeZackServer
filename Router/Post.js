const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const { mongoose } = require("mongoose");

router.post("/uploadPost", async (req, res) => {
  const { userId, Images, postText, postLink, Time } = req.body;
  try {
    // Validate input fields
    if (!postText && !Images?.length && !postLink) {
      return res.status(400).send("Post must contain text, images, or a link");
    }
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");
    // Create a new post object with a timestamp
    const newPost = {
      number: 0, // Explicitly setting default values
      PostText: postText,
      PostLink: postLink,
      Images: Images,
      Time: Time,
      Like: 0,
      SenderId: user._id,
    };
    // Push the new post to the user's Posts array
    user.Posts.unshift(newPost);
    await user.save();
    // Get the postId of the newly added post
    const postId = user.Posts[0]._id;
    // Increment post length
    await User.findByIdAndUpdate(userId, { $inc: { PostLength: 1 } });
    // Share the post with user's connections
    for (const connection of user.Connections) {
      const connectionUser = await User.findById(connection.ConnectionsdId);
      if (connectionUser) {
        // If the connection's post list has 15 posts, remove the last one
        if (connectionUser.ConnectionsPost.length >= 15) {
          connectionUser.ConnectionsPost.pop(); // Removes the last post ID
        }
        connectionUser.ConnectionsPost.unshift({ postId }); // Adds the new post at the beginning
        await connectionUser.save();
      }
    }
    // Fetch the latest 5 posts of the user
    const updatedUserPosts = user.Posts.slice(0, 5); // Get the first 5 posts (most recent)
    // Respond with the post ID and the latest posts
    res.status(200).send({
      text: "Post uploaded successfully",
      postId,
      Posts: updatedUserPosts,
      userPostLength: user.PostLength,
    });
  } catch (error) {
    console.error("Error uploading post:", error);
    res.status(500).send("An error occurred while uploading the post.");
  }
});
// Delete post
router.post("/deletePost/:id", async (req, res) => {
  const { postId } = req.body;
  const { id: userId } = req.params;
  try {
    // Validate userId and postId
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(postId)
    ) {
      return res.status(400).send("Invalid userId or postId");
    }
    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    // Check if the post exists in user's posts
    const postExists = user.Posts.some(
      (post) => post._id.toString() === postId
    );
    if (!postExists) {
      return res.status(404).send("Post not found in user data");
    }
    // Remove the post from user's Posts array
    user.Posts = user.Posts.filter((post) => post._id.toString() !== postId);
    await User.findByIdAndUpdate(
      userId,
      { $inc: { PostLength: -1 } },
      { new: true }
    );
    await user.save();
    await Promise.all(
      user.Connections.map(async (connection) => {
        const connectionUser = await User.findById(connection.ConnectionsdId);
        if (connectionUser) {
          connectionUser.ConnectionsPost =
            connectionUser.ConnectionsPost.filter(
              (connPost) => connPost.postId.toString() !== postId
            );
          await connectionUser.save();
        }
      })
    );
    // Get the latest 5 posts after deletion
    const updatedUserPosts = user.Posts.slice(0, 5).map((post) => ({
      PostText: post.PostText,
      PostLink: post.PostLink,
      Images: post.Images,
      Time: post.Time,
      Like: post.Like,
      SenderId: post.SenderId,
      Comments: post.Comments,
      LikedUsers: post.LikedUsers,
      // Excluding Comments and LikedUsers
    }));
    // Respond with the updated posts
    return res
      .status(200)
      .json({ Posts: updatedUserPosts, userPostLength: user.PostLength });
  } catch (error) {
    console.error("Error in deletePost route:", error);
    return res
      .status(500)
      .send("An internal server error occurred while deleting the post.");
  }
});
// Get connection posts
router.get("/getConnectionPosts/:userId", async (req, res) => {
  const { userId } = req.params;
  const { skip = 0, limit = 10 } = req.query;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send("Invalid userId");
    }

    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Helper to fetch random posts
    const getRandomUserPost = async (size = 10, excludeIds = []) => {
      try {
        const users = await User.aggregate([
          {
            $match: {
              Posts: { $exists: true, $not: { $size: 0 } },
            },
          },
          {
            $sample: { size },
          },
        ]);

        const randomPostIds = users
          .map((user) => user.Posts[0]?._id)
          .filter((id) => id && !excludeIds.includes(id.toString()));

        return randomPostIds;
      } catch (error) {
        console.log("Error fetching random user posts:", error);
        return [];
      }
    };

    // Start with connection posts
    let postIds = user.ConnectionsPost.map((post) => post.postId);

    // If no connection posts, get random ones
    if (postIds.length === 0) {
      postIds = await getRandomUserPost();
      if (postIds.length === 0) {
        return res.status(200).json([]);
      }
    }

    // If not enough posts, fill with randoms
    if (postIds.length < 10) {
      const balanceNeeded = 10 - postIds.length;
      const balanceIds = await getRandomUserPost(
        balanceNeeded,
        postIds.map((id) => id.toString())
      );
      postIds = [...postIds, ...balanceIds];
    }

    // Main aggregation with sort
    const posts = await User.aggregate([
      { $unwind: "$Posts" },
      {
        $match: {
          "Posts._id": {
            $in: postIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      },
      {
        $sort: {
          "Posts.Time": -1, // 🔥 Sort by latest post first
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "Posts.SenderId",
          foreignField: "_id",
          as: "SenderDetails",
        },
      },
      { $unwind: "$SenderDetails" },
      {
        $project: {
          "Posts._id": 1,
          "Posts.PostText": 1,
          "Posts.PostLink": 1,
          "Posts.Images": 1,
          "Posts.Time": 1,
          "Posts.Like": 1,
          "Posts.CommentCount": 1,
          "Posts.LikedUsers": 1,
          "SenderDetails.firstName": 1,
          "SenderDetails.LastName": 1,
          "SenderDetails.Images.profile": 1,
          "SenderDetails.InstitudeName": 1,
          "SenderDetails._id": 1,
        },
      },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) },
    ]);

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching connection posts.");
  }
});

// get user posts
router.post("/getUserPosts", async (req, res) => {
  const { userId, offsets } = req.body;
  try {
    // Find the user and populate the Posts field
    const user = await User.findById(userId).populate("Posts");
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (!user.Posts || user.Posts.length === 0) {
      return res.status(200).send({ posts: [], hasMore: false }); // Ensure proper response format
    }
    // Paginate the populated posts
    const paginatedPosts = user.Posts.slice(offsets, offsets + 5).map(
      (post) => ({
        PostText: post.PostText,
        PostLink: post.PostLink,
        Images: post.Images,
        Time: post.Time,
        Like: post.Like,
        SenderId: post.SenderId,
        CommentCount: post.CommentCount,
        LikedUsers: post.LikedUsers,
        _id: post._id,
        // Excluding Comments and LikedUsers
      })
    );
    const hasMore = offsets + 5 < user.Posts.length;
    res.status(200).json({ posts: paginatedPosts, hasMore });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).send({ message: "An error occurred while fetching posts" });
  }
});
// Like post
router.post("/likePost/:postId", async (req, res) => {
  const { postId } = req.params;
  const { userId, LikedTime } = req.body;

  try {
    // Validate userId and postId
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid postId or userId" });
    }

    // Find the user who owns the post
    const postOwner = await User.findOne({ "Posts._id": postId });

    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the specific post within the user's posts
    const post = postOwner.Posts.id(postId);

    // Check if the user has already liked the post
    const alreadyLiked = post.LikedUsers.some(
      (likeEntry) => likeEntry.LikedUser.toString() === userId
    );

    if (alreadyLiked) {
      return res
        .status(400)
        .json({ message: "User has already liked this post" });
    }

    // Increment the Like count and add the user to the LikedUsers array
    post.Like += 1;
    post.LikedUsers.unshift({ LikedUser: userId, LikedTime: LikedTime });
    await postOwner.save();

    // Fetch the liked user's details
    const likedUser = await User.findById(userId).select(
      "firstName LastName Images.profile"
    );

    res.status(200).json({
      message: "Post liked successfully",
      likedUser: {
        firstName: likedUser.firstName,
        lastName: likedUser.LastName,
      },
      post,
    });
  } catch (error) {
    console.error("Error liking post:", error);
    res
      .status(500)
      .json({ message: "An error occurred while liking the post." });
  }
});
// Unlike post
router.post("/unlikePost/:postId", async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;
  try {
    // Validate userId and postId
    if (
      !mongoose.isValidObjectId(postId) ||
      !mongoose.isValidObjectId(userId)
    ) {
      return res.status(400).json({ message: "Invalid postId or userId" });
    }
    // Update post in a single query using $pull and $inc
    const updatedUser = await User.findOneAndUpdate(
      { "Posts._id": postId, "Posts.LikedUsers.LikedUser": userId },
      {
        $inc: { "Posts.$.Like": -1 },
        $pull: { "Posts.$.LikedUsers": { LikedUser: userId } },
      },
      { new: true }
    );
    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "Post not found or not liked by user" });
    }
    res.status(200).json({ message: "Post unliked successfully" });
  } catch (error) {
    console.error("Error unliking post:", error);
    res
      .status(500)
      .json({ message: "An error occurred while unliking the post." });
  }
});
// get liked users
router.get("/getLikedUsers/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    // console.log("", postId);

    const { skip = 0, limit = 10 } = req.query; // Defaults to skip 0 and limit 10
    // console.log(skip, limit);
    // Find the user who owns the post
    const postOwner = await User.findOne({ "Posts._id": postId });
    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Extract the specific post from the user's Posts array
    const post = postOwner.Posts.id(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Extract the LikedUsers array
    const likedUsersData = post.LikedUsers.map((user) => ({
      LikedUser: user.LikedUser,
      LikedTime: user.LikedTime,
    }));
    // Paginate the LikedUsers array
    const paginatedLikedUsersData = likedUsersData.slice(
      parseInt(skip),
      parseInt(skip) + parseInt(limit)
    );
    const likedUserIds = paginatedLikedUsersData.map((user) => user.LikedUser);
    // Find the details of the users who liked the post
    const likedUsers = await User.find(
      { _id: { $in: likedUserIds } },
      "firstName LastName Images.profile _id"
    );
    // Combine user details with the liked time  afeter push update
    const response = likedUsers.map((user) => {
      const userLikeData = paginatedLikedUsersData.find(
        (likeData) => likeData.LikedUser.toString() === user._id.toString()
      );
      return {
        firstName: user?.firstName,
        LastName: user?.LastName,
        profile: user?.Images.profile,
        LikedTime: userLikeData?.LikedTime,
        userId: user?._id,
      };
    });
    const hasMore = likedUsersData.length > parseInt(skip) + parseInt(limit);
    return res.status(200).json({ likedUsers: response, hasMore });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});
// ---upload comments
router.post("/commentPost/:postId", async (req, res) => {
  const { postId } = req.params;
  const { userId, commentText, commentTime } = req.body;
  try {
    // Validate userId and postId
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid postId or userId" });
    }
    if (!commentText) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    // Find the user who owns the post
    const postOwner = await User.findOne({ "Posts._id": postId });
    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Find the specific post within the user's posts
    const post = postOwner.Posts.id(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found within user" });
    }
    // Update comment length
    post.CommentCount += 1;
    // Add the comment to the post's Comments array
    const newComment = {
      commentedBy: userId,
      commentText,
      commentedAt: commentTime,
    };
    post.Comments.unshift(newComment);
    // Save postOwner document to update the post
    await postOwner.save();
    // Fetch the newly created comment's ID
    const newCommentId = post.Comments[0]._id;
    // Fetch the commented user's details
    const commentedUser = await User.findById(userId).select(
      "firstName LastName Images.profile _id"
    );
    if (!commentedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "Comment added successfully",
      comment: {
        _id: newCommentId,
        commentText,
        commentedAt: commentTime,
        firstName: commentedUser.firstName,
        LastName: commentedUser.LastName,
        profile: commentedUser.Images.profile,
        userId: commentedUser._id,
      },
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res
      .status(500)
      .json({ message: "An error occurred while adding the comment." });
  }
});
// delete post Comment
router.post("/deleteComment", async (req, res) => {
  try {
    const { postId, commentedId } = req.body;

    // Validate IDs immediately
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(commentedId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid postId or commentedId" });
    }
    //  Directly update the comment count and remove the comment in one query
    const result = await User.findOneAndUpdate(
      { "Posts._id": postId },
      {
        $inc: { "Posts.$.CommentCount": -1 },
        $pull: { "Posts.$.Comments": { _id: commentedId } },
      },
      { new: true }
    );
    // If no post found
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    // console.log(
    //   `✅ Comment deleted from Post: ${postId}, Remaining Count: ${result.Posts.CommentCount}`
    // );
    return res
      .status(200)
      .json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    // console.error("❌ Error deleting comment:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});
// ---- get comments ----
router.get("/getComments/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    // console.log(postId);

    const { skip = 0, limit = 10 } = req.query; // Defaults to skip 0 and limit 10

    // Find the user who owns the post
    const postOwner = await User.findOne({ "Posts._id": postId });

    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the specific post within the user's posts
    const post = postOwner.Posts.id(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Paginate the comments array
    const paginatedComments = post.Comments.slice(
      parseInt(skip),
      parseInt(skip) + parseInt(limit)
    );
    // Ensure commentedBy contains only valid IDs
    const commentUserIds = paginatedComments
      .map((comment) => comment.commentedBy)
      .filter((id) => mongoose.Types.ObjectId.isValid(id)); // Remove invalid IDs
    const commentedUsers = await User.find(
      { _id: { $in: commentUserIds } },
      "firstName LastName Images.profile _id"
    );
    const commentsWithUserDetails = paginatedComments.map((comment) => {
      const commentedUser = commentedUsers.find(
        (user) => user._id.toString() === comment.commentedBy?.toString()
      );
      return {
        commentText: comment.commentText,
        commentedAt: comment.commentedAt,
        userId: commentedUser?._id || null,
        firstName: commentedUser?.firstName || "Unknown",
        LastName: commentedUser?.LastName || "User",
        profile: commentedUser?.Images?.profile || null,
        _id: comment._id,
      };
    });
    const hasMore = post.Comments.length > parseInt(skip) + parseInt(limit);
    res.status(200).json({ comments: commentsWithUserDetails, hasMore });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching comments." });
  }
});
// get the particular post
router.get("/getPostDetails/:postId", async (req, res) => {
  const { postId } = req.params;
  // console.log(postId);
  try {
    // Aggregate query to find the post and the sender details
    const postDetails = await User.aggregate([
      {
        $match: {
          "Posts._id": new mongoose.Types.ObjectId(postId), // Match the post ID
        },
      },
      {
        $unwind: "$Posts", // Unwind the Posts array to access individual posts
      },
      {
        $match: {
          "Posts._id": new mongoose.Types.ObjectId(postId), // Match the specific post by ID again after unwind
        },
      },
      {
        $lookup: {
          from: "users", // Reference the User collection to fetch sender details
          localField: "Posts.SenderId",
          foreignField: "_id",
          as: "SenderDetails",
        },
      },
      {
        $unwind: "$SenderDetails", // Unwind the SenderDetails array
      },
      {
        $project: {
          "Posts._id": 1,
          "Posts.PostText": 1,
          "Posts.PostLink": 1,
          "Posts.Images": 1,
          "Posts.Time": 1,
          "Posts.Like": 1,
          "Posts.CommentCount": 1,
          "Posts.LikedUsers": 1,
          "SenderDetails.firstName": 1,
          "SenderDetails.LastName": 1,
          "SenderDetails.Images.profile": 1,
          "SenderDetails.InstitudeName": 1,
          "SenderDetails._id": 1,
        },
      },
    ]);
    if (!postDetails || postDetails.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    // console.log(postDetails[0]);
    res.status(200).send(postDetails[0]); // Send the post details
  } catch (error) {
    console.error("Error retrieving post details:", error);
    res.status(500).json({
      message: "An error occurred while retrieving the post details.",
    });
  }
});

module.exports = router;

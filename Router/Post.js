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

    const postIds = user.ConnectionsPost.map((post) => post.postId);
    if (postIds.length === 0) {
      return res.status(200).json([]);
    }

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
  // console.log(userId);
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

    if (!alreadyLiked || post.Like < 0) {
      return res
        .status(400)
        .json({ message: "User has not liked this post yet" });
    }

    // Decrement the Like count and remove the user from the LikedUsers array
    post.Like -= 1;
    post.LikedUsers = post.LikedUsers.filter(
      (likeEntry) => likeEntry.LikedUser.toString() !== userId
    );
    await postOwner.save();

    res.status(200).json({
      message: "Post unliked successfully",
      // post,
    });
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
    const { postId } = req.params;
    const { skip = 0, limit = 10 } = req.query; // Defaults to skip 0 and limit 10
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
  // console.log(userId, commentText, commentTime, postId);
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
    // update comment length
    if (post) {
      post.CommentCount += 1;
    }
    // Add the comment to the post's Comments array
    post.Comments.unshift({
      commentedBy: userId,
      commentText,
      commentedAt: commentTime,
    });
    await postOwner.save();
    // Fetch the commented user's details
    const commentedUser = await User.findById(userId).select(
      "firstName LastName Images.profile _id"
    );

    res.status(200).json({
      message: "Comment added successfully",
      comment: {
        commentText,
        commentedAt: Date.now(),
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
  const { postId, commentedId } = req.query;
  try {
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(commentedId)
    ) {
      return res.status(400).json({ message: "Invalid postId or userId" });
    }
    const postOwner = await User.findOne({ "Post._id": postId });
    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Find the specific post within the user's posts
    const post = postOwner.Posts.id(postId);
    if (post) {
      post.CommentCount += 1;
    }
    // remove the commented by user posted commented using filter
    post.Comments.filter((comments) => commentedId != comments._id);
    await postOwner.save();
    res.status(200);
  } catch (error) {
    res.status(504);
  }
});
// ---- get comments ----
const { Types } = require("mongoose");

router.get("/getComments/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    console.log(postId);

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
      .filter((id) => Types.ObjectId.isValid(id)); // Remove invalid IDs
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
          "Posts.Comments": 1,
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

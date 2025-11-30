import User from "../Models/User.js";
import { mongoose } from "mongoose";

// Upload post
const uploadPost = async (req, res) => {
  const { userId, Images, postText, postLink, Time } = req.body;
  try {
    if (!postText && !Images?.length && !postLink) {
      return res.status(400).send("Post must contain text, images, or a link");
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");
    const newPost = {
      number: 0,
      PostText: postText,
      PostLink: postLink,
      Images: Images,
      Time: Time,
      Like: 0,
      SenderId: user._id,
    };
    user.Posts.unshift(newPost);
    await user.save();
    const postId = user.Posts[0]._id;
    await User.findByIdAndUpdate(userId, { $inc: { PostLength: 1 } });
    for (const connection of user.Connections) {
      const connectionUser = await User.findById(connection.ConnectionsdId);
      if (connectionUser) {
        if (connectionUser.ConnectionsPost.length >= 15) {
          connectionUser.ConnectionsPost.pop();
        }
        connectionUser.ConnectionsPost.unshift({ postId });
        await connectionUser.save();
      }
    }
    const updatedUserPosts = user.Posts.slice(0, 5);
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
};

// Delete post
const deletePost = async (req, res) => {
  const { postId } = req.body;
  const { id: userId } = req.params;
  try {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(postId)
    ) {
      return res.status(400).send("Invalid userId or postId");
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const postExists = user.Posts.some(
      (post) => post._id.toString() === postId
    );
    if (!postExists) {
      return res.status(404).send("Post not found in user data");
    }
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
    const updatedUserPosts = user.Posts.slice(0, 5).map((post) => ({
      PostText: post.PostText,
      PostLink: post.PostLink,
      Images: post.Images,
      Time: post.Time,
      Like: post.Like,
      SenderId: post.SenderId,
      Comments: post.Comments,
      LikedUsers: post.LikedUsers,
    }));
    return res
      .status(200)
      .json({ Posts: updatedUserPosts, userPostLength: user.PostLength });
  } catch (error) {
    console.error("Error in deletePost route:", error);
    return res
      .status(500)
      .send("An internal server error occurred while deleting the post.");
  }
};

// Get connection posts
const getConnectionPosts = async (req, res) => {
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

    let postIds = user.ConnectionsPost.map((post) => post.postId);

    if (postIds.length === 0) {
      postIds = await getRandomUserPost();
      if (postIds.length === 0) {
        return res.status(200).json([]);
      }
    }

    if (postIds.length < 10) {
      const balanceNeeded = 10 - postIds.length;
      const balanceIds = await getRandomUserPost(
        balanceNeeded,
        postIds.map((id) => id.toString())
      );
      postIds = [...postIds, ...balanceIds];
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
        $sort: {
          "Posts.Time": -1,
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
};

// Get user posts
const getUserPosts = async (req, res) => {
  const { userId, offsets } = req.body;
  try {
    const user = await User.findById(userId).populate("Posts");
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (!user.Posts || user.Posts.length === 0) {
      return res.status(200).send({ posts: [], hasMore: false });
    }
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
      })
    );
    const hasMore = offsets + 5 < user.Posts.length;
    res.status(200).json({ posts: paginatedPosts, hasMore });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).send({ message: "An error occurred while fetching posts" });
  }
};

// Like post
const likePost = async (req, res) => {
  const { postId } = req.params;
  const { userId, LikedTime } = req.body;

  try {
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid postId or userId" });
    }

    const postOwner = await User.findOne({ "Posts._id": postId });

    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }

    const post = postOwner.Posts.id(postId);

    const alreadyLiked = post.LikedUsers.some(
      (likeEntry) => likeEntry.LikedUser.toString() === userId
    );

    if (alreadyLiked) {
      return res
        .status(400)
        .json({ message: "User has already liked this post" });
    }

    post.Like += 1;
    post.LikedUsers.unshift({ LikedUser: userId, LikedTime: LikedTime });
    await postOwner.save();

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
};

// Unlike post
const unlikePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;
  try {
    if (
      !mongoose.isValidObjectId(postId) ||
      !mongoose.isValidObjectId(userId)
    ) {
      return res.status(400).json({ message: "Invalid postId or userId" });
    }
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
};

// Get liked users
const getLikedUsers = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { skip = 0, limit = 10 } = req.query;
    const postOwner = await User.findOne({ "Posts._id": postId });
    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }
    const post = postOwner.Posts.id(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const likedUsersData = post.LikedUsers.map((user) => ({
      LikedUser: user.LikedUser,
      LikedTime: user.LikedTime,
    }));
    const paginatedLikedUsersData = likedUsersData.slice(
      parseInt(skip),
      parseInt(skip) + parseInt(limit)
    );
    const likedUserIds = paginatedLikedUsersData.map((user) => user.LikedUser);
    const likedUsers = await User.find(
      { _id: { $in: likedUserIds } },
      "firstName LastName Images.profile _id"
    );
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
};

// Comment post
const commentPost = async (req, res) => {
  const { postId } = req.params;
  const { userId, commentText, commentTime } = req.body;
  try {
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid postId or userId" });
    }
    if (!commentText) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    const postOwner = await User.findOne({ "Posts._id": postId });
    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }
    const post = postOwner.Posts.id(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found within user" });
    }
    post.CommentCount += 1;
    const newComment = {
      commentedBy: userId,
      commentText,
      commentedAt: commentTime,
    };
    post.Comments.unshift(newComment);
    await postOwner.save();
    const newCommentId = post.Comments[0]._id;
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
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const { postId, commentedId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(commentedId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid postId or commentedId" });
    }
    const result = await User.findOneAndUpdate(
      { "Posts._id": postId },
      {
        $inc: { "Posts.$.CommentCount": -1 },
        $pull: { "Posts.$.Comments": { _id: commentedId } },
      },
      { new: true }
    );
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get comments
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { skip = 0, limit = 10 } = req.query;

    const postOwner = await User.findOne({ "Posts._id": postId });

    if (!postOwner) {
      return res.status(404).json({ message: "Post not found" });
    }

    const post = postOwner.Posts.id(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const paginatedComments = post.Comments.slice(
      parseInt(skip),
      parseInt(skip) + parseInt(limit)
    );
    const commentUserIds = paginatedComments
      .map((comment) => comment.commentedBy)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
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
};

// Get post details
const getPostDetails = async (req, res) => {
  const { postId } = req.params;
  try {
    const postDetails = await User.aggregate([
      {
        $match: {
          "Posts._id": new mongoose.Types.ObjectId(postId),
        },
      },
      {
        $unwind: "$Posts",
      },
      {
        $match: {
          "Posts._id": new mongoose.Types.ObjectId(postId),
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
      {
        $unwind: "$SenderDetails",
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
    res.status(200).send(postDetails[0]);
  } catch (error) {
    console.error("Error retrieving post details:", error);
    res.status(500).json({
      message: "An error occurred while retrieving the post details.",
    });
  }
};

export {
  uploadPost,
  deletePost,
  getConnectionPosts,
  getUserPosts,
  likePost,
  unlikePost,
  getLikedUsers,
  commentPost,
  deleteComment,
  getComments,
  getPostDetails,
};


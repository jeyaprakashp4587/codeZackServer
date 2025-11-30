import User from "../Models/User.js";

// Get user suggestions
const getUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = await User.findById(id).select("Connections").lean();
    if (!currentUser) {
      return res.status(404).send("User not found");
    }
    const users = await User.aggregate([
      { $sample: { size: 6 } },
      {
        $project: {
          _id: 1,
          firstName: 1,
          LastName: 1,
          InstitudeName: 1,
          "Images.coverImg": 1,
          "Images.profile": 1,
          onlineStatus: 1,
        },
      },
    ]);

    const suggestedUsers = users.filter(
      (user) =>
        user._id.toString() !== id &&
        !currentUser.Connections.some(
          (connection) => connection.ConnectionsdId == user._id.toString()
        )
    );

    if (suggestedUsers.length > 0) {
      res.json(suggestedUsers);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving user suggestions");
  }
};

// Get all suggestions
const getAllSuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { skip = 0, limit = 6 } = req.query;
    const parsedSkip = parseInt(skip, 10);
    const parsedLimit = parseInt(limit, 10);
    
    const currentUser = await User.findById(id).select("Connections").lean();
    if (!currentUser) {
      return res.status(404).send("User not found");
    }

    // Get connection IDs to exclude (convert to ObjectId if needed)
    const connectionIds = currentUser.Connections.map(
      (conn) => conn.ConnectionsdId
    );
    connectionIds.push(id); // Also exclude current user

    // Calculate how many users we need to sample
    // Sample more to ensure we have enough after pagination
    const sampleSize = Math.min(parsedSkip + parsedLimit + 50, 1000);

    // Aggregate pipeline: filter first, then sample (ensures no duplicates)
    const users = await User.aggregate([
      {
        // Exclude current user and existing connections at database level
        $match: {
          _id: { $nin: connectionIds },
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          LastName: 1,
          InstitudeName: 1,
          "Images.coverImg": 1,
          "Images.profile": 1,
          District: 1,
        },
      },
      {
        // Sample random users (MongoDB guarantees no duplicates in $sample)
        $sample: { size: sampleSize },
      },
    ]);

    // Paginate the results
    const paginatedUsers = users.slice(parsedSkip, parsedSkip + parsedLimit);
    const hasMore = users.length > parsedSkip + parsedLimit;

    res.json({
      hasMore,
      data: paginatedUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving user suggestions");
  }
};

export {
  getUsers,
  getAllSuggestions,
};


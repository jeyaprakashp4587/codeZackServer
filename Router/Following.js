const express = require("express");
const router = express.Router();
const User = require("../Models/User");

// Find existing connection
router.post("/findExistsConnection", async (req, res) => {
  try {
    const { ConnectionId, userId } = req.body;

    // Use projection to limit the data retrieved from the database
    const user = await User.findById(userId).select("Connections").lean();

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Use 'some' for better performance when checking existence
    const findExists = user.Connections.some(
      (connection) => connection.ConnectionsdId == ConnectionId
    );

    if (findExists) {
      res.send("Yes");
    } else {
      res.send("No");
    }
  } catch (error) {
    res.status(500).send("Error finding connection");
  }
});

// Add connection
router.post("/addConnection", async (req, res) => {
  try {
    const { ConnectionId, userId } = req.body;

    // Use projection to limit the data retrieved from the database
    const user = await User.findById(userId).select("Connections");

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Check if the connection already exists to avoid duplicates
    const connectionExists = user.Connections.some(
      (connection) => connection.ConnectionsdId == ConnectionId
    );

    if (connectionExists) {
      return res.status(400).send("Connection already exists");
    }

    // Push the new connection
    user.Connections.push({ ConnectionsdId: ConnectionId });

    await user.save();
    res.send("Sucess");
  } catch (error) {
    res.status(500).send("Error adding connection");
  }
});

// Remove connection
router.post("/removeConnection/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ConnectionId } = req.body;

    // Use projection to limit the data retrieved from the database
    const user = await User.findById(id).select("Connections");

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Filter out the connection to remove
    const updatedConnections = user.Connections.filter(
      (connection) => connection.ConnectionsdId != ConnectionId
    );

    if (updatedConnections.length === user.Connections.length) {
      return res.status(400).send("Connection not found");
    }

    user.Connections = updatedConnections;
    await user.save();
    res.send("Done");
  } catch (error) {
    res.status(500).send("Error removing connection");
  }
});
// get user for fetch mutual user and send the user id to client
router.post("/getMutuals", async (req, res) => {
  const { selectedUserId, userId } = req.body;
  try {
    const selectedUser = await User.findById(selectedUserId).lean();
    if (!selectedUser) {
      return res.status(404).json({ message: "Selected user not found" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Selected user connections
    const selectedUserConnectionsId =
      selectedUser.Connections?.map(
        (connection) => connection.ConnectionsdId
      ) || [];
    // Current user connections
    const userConnectionsId =
      user.Connections?.map((connection) => connection.ConnectionsdId) || [];
    // Return empty if either has no connections
    if (!userConnectionsId.length || !selectedUserConnectionsId.length) {
      return res.status(200).json({ users: [] });
    }
    // Find mutual connections
    const mutualsIds = selectedUserConnectionsId.filter((id) =>
      userConnectionsId.includes(id)
    );
    // Fetch mutual user data
    const mutualUserData = await User.find({ _id: { $in: mutualsIds } }).select(
      "firstName Images.profile"
    );
    res.status(200).json({ users: mutualUserData });
  } catch (error) {
    console.error("Error fetching mutual connections:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// get user networks connecton
router.get("/getNetworks/:id", async (req, res) => {
  const { id } = req.params;
  const skip = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const selectedUser = await User.findById(id).lean();
    if (!selectedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found", hasMore: false });
    }

    const totalConnections = selectedUser.Connections.length;
    const paginatedConnections = selectedUser.Connections.slice(
      skip,
      skip + limit
    );
    const connectionIds = paginatedConnections.map((c) => c.ConnectionsdId);

    // Fetch all users in a single query
    const users = await User.find({ _id: { $in: connectionIds } })
      .select("_id firstName LastName Images.profile onlineStatus")
      .lean();

    // Keep the structure exactly as required
    const formattedUsers = users.map((user) => ({
      firstName: user.firstName,
      lastName: user.LastName,
      profileImg: user.Images?.profile || "",
      id: user._id,
      onlineStatus: user.onlineStatus,
    }));

    const hasMore = skip + limit < totalConnections; // Check if more data exists

    res.status(200).json({ users: formattedUsers, hasMore });
  } catch (error) {
    console.error("Error fetching user networks:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      hasMore: false,
    });
  }
});

module.exports = router;

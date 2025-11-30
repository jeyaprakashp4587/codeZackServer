import User from "../Models/User.js";

// Find existing connection
const findExistsConnection = async (req, res) => {
  try {
    const { ConnectionId, userId } = req.body;

    const userExists = await User.exists({
      _id: userId,
      Connections: { $elemMatch: { ConnectionsdId: ConnectionId } },
    });
    res.send(userExists ? "Yes" : "No");
  } catch (error) {
    res.status(500).send("Error finding connection");
  }
};

// Add connection
const addConnection = async (req, res) => {
  try {
    const { ConnectionId, userId } = req.body;

    const result = await User.updateOne(
      { _id: userId },
      { $addToSet: { Connections: { ConnectionsdId: ConnectionId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).send("Connection already exists");
    }

    res.send("Sucess");
  } catch (error) {
    res.status(500).send("Error adding connection");
  }
};

// Remove connection
const removeConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const { ConnectionId } = req.body;

    const result = await User.updateOne(
      { _id: id },
      { $pull: { Connections: { ConnectionsdId: ConnectionId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).send("Connection not found");
    }

    res.send("Done");
  } catch (error) {
    res.status(500).send("Error removing connection");
  }
};

// Get mutuals
const getMutuals = async (req, res) => {
  const { selectedUserId, userId } = req.body;
  try {
    const selectedUser = await User.findById(selectedUserId).lean();
    if (!selectedUser) {
      return res.status(404).json({ message: "Selected user not found" });
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const selectedUserConnectionsId =
      selectedUser.Connections?.map(
        (connection) => connection.ConnectionsdId
      ) || [];
    const userConnectionsId =
      user.Connections?.map((connection) => connection.ConnectionsdId) || [];
    if (!userConnectionsId.length || !selectedUserConnectionsId.length) {
      return res.status(200).json({ users: [] });
    }
    const mutualsIds = selectedUserConnectionsId.filter((id) =>
      userConnectionsId.includes(id)
    );
    const limitedMutualIds = mutualsIds.slice(0, 3);
    const mutualUserData = await User.find({
      _id: { $in: limitedMutualIds },
    }).select("firstName Images.profile");
    res.status(200).json({ users: mutualUserData });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get networks
const getNetworks = async (req, res) => {
  const { id } = req.params;
  const skip = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const selectedUser = await User.findById(id)
      .select({ Connections: { $slice: [skip, limit] } })
      .lean();

    if (!selectedUser || !selectedUser.Connections.length) {
      return res
        .status(404)
        .json({ success: false, message: "User not found", hasMore: false });
    }

    const connectionIds = selectedUser.Connections.map((c) => c.ConnectionsdId);

    const users = await User.find({ _id: { $in: connectionIds } })
      .select("_id firstName LastName Images.profile onlineStatus")
      .lean();

    const formattedUsers = users.map((user) => ({
      firstName: user.firstName,
      lastName: user.LastName,
      profileImg: user.Images?.profile || "",
      id: user._id,
      onlineStatus: user.onlineStatus,
    }));

    const totalConnections = await User.findById(id)
      .select("Connections")
      .lean();
    const hasMore = skip + limit < totalConnections.Connections.length;

    res.status(200).json({ users: formattedUsers, hasMore });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      hasMore: false,
    });
  }
};

export {
  findExistsConnection,
  addConnection,
  removeConnection,
  getMutuals,
  getNetworks,
};


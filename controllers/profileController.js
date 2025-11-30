import User from "../Models/User.js";
import { DB1 } from "../Database/CCDB.js";

// Update profile images
const updateProfileImages = async (req, res) => {
  const { ImageUri, ImageType, userId } = req.body;

  try {
    if (!ImageUri || !ImageType || !userId) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    let updateField = {};
    if (ImageType === "profile") {
      updateField = { "Images.profile": ImageUri };
    } else if (ImageType === "cover") {
      updateField = { "Images.coverImg": ImageUri };
    } else {
      return res.status(400).json({ error: "Invalid ImageType" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateField },
      { new: true, projection: { Images: 1 } }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ data: updatedUser.Images });
  } catch (error) {
    console.error("Error updating profile images:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update profile data
const updateProfileData = async (req, res) => {
  const { FirstName, LastName, Bio } = req.body;
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let updated = false;

    if (FirstName) {
      user.firstName = FirstName;
      updated = true;
    }
    if (LastName) {
      user.LastName = LastName;
      updated = true;
    }
    if (Bio) {
      user.Bio = Bio;
      updated = true;
    }

    if (updated) {
      await user.save();
    }

    return res.status(200).json({
      firstName: user.firstName,
      LastName: user.LastName,
      Bio: user.Bio,
    });
  } catch (error) {
    console.error("Error updating profile data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Save FCM token
const saveFcmToken = async (req, res) => {
  const { userId, FcmToken } = req.body;

  try {
    if (!userId || !FcmToken) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.FcmId !== FcmToken) {
      user.FcmId = FcmToken;
      await user.save();
    }

    return res.status(200).send({ message: "FCM token saved successfully" });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Set online status
const setOnlineStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (typeof status !== "boolean") {
      return res
        .status(400)
        .json({ error: "Invalid status. It must be a boolean." });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { onlineStatus: status },
      { new: true, lean: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    console.log(user.onlineStatus);

    res.status(200).json({
      message: "Online status updated successfully.",
      onlineStatus: user.onlineStatus,
    });
  } catch (error) {
    console.error("Error updating online status:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error. Please try again later." });
  }
};

// Get latest version
const getLatestVersion = async (req, res) => {
  try {
    const collection = DB1.collection("AppVersion");
    const getVersion = await collection.find({}).toArray();
    res.status(200).json({ version: getVersion[0].version });
  } catch (error) {
    res.status(504);
  }
};

export {
  updateProfileImages,
  updateProfileData,
  saveFcmToken,
  setOnlineStatus,
  getLatestVersion,
};


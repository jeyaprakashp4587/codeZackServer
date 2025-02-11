const express = require("express");
const router = express.Router();
const User = require("../Models/User");

// Upload user profile and cover photo
router.post("/updateProfileImages", async (req, res) => {
  const { ImageUri, ImageType, userId } = req.body;

  try {
    if (!ImageUri || !ImageType || !userId) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (ImageType === "profile") {
      user.Images.profile = ImageUri;
    } else if (ImageType === "cover") {
      user.Images.coverImg = ImageUri;
    } else {
      return res.status(400).json({ error: "Invalid ImageType" });
    }

    await user.save();
    return res.status(200).json({ data: user.Images });
  } catch (error) {
    console.error("Error updating profile images:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile data (name, bio)
router.post("/updateProfileData/:id", async (req, res) => {
  const { FirstName, LastName, Bio } = req.body;
  const { id } = req.params;
  // console.log(FirstName, LastName, Bio);

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
});
// Save FCM token
router.post("/saveFcmToken", async (req, res) => {
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
});
// set online status
router.post("/setOnlineStatus/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Validate the input
    if (typeof status !== "boolean") {
      return res
        .status(400)
        .json({ error: "Invalid status. It must be a boolean." });
    }

    // Update the user's status in the database
    const user = await User.findByIdAndUpdate(
      id,
      { onlineStatus: status },
      { new: true, lean: true } // Use lean for performance if you don't need methods
    );

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    console.log(user.onlineStatus);

    // Respond with the updated user object
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
});

module.exports = router;

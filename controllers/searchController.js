const User = require("../Models/User");

// Get user name
const getUserName = async (req, res) => {
  const { userName } = req.body;
  try {
    if (userName && userName.trim().length > 1) {
      const searchQuery = userName.trim().toLowerCase();
      const users = await User.find({
        $or: [
          { firstName: { $regex: searchQuery, $options: "i" } },
          { LastName: { $regex: searchQuery, $options: "i" } },
        ],
      })
        .limit(20)
        .select("firstName LastName Images.profile _id InstitudeName");

      res.status(200).json(users);
    } else {
      res.status(200).json([]);
    }
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getUserName,
};


const User = require("../Models/User");
const { DB1 } = require("../Database/CCDB");

// Get company details
const getCompanyDetails = async (req, res) => {
  const companies = DB1.collection("Company");

  if (companies) {
    const compDetail = await companies
      .find({}, { projection: { company_name: 1, companyLogo: 1, colors: 1 } })
      .toArray();

    if (compDetail.length > 0) {
      res.json(compDetail);
    } else {
      res.status(404).json({ message: "No companies found" });
    }
  } else {
    res.status(500).json({ message: "Error fetching companies" });
  }
};

// Get particular company
const getParticularCompany = async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: "Company name is required" });
    }
    const collection = DB1.collection("Company");
    const company = await collection.findOne({ company_name: companyName });
    if (company) {
      res.status(200).json(company);
    } else {
      res.status(404).json({ error: "Company not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Add interview
const addInterView = async (req, res) => {
  const { companyName, userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const existingInterview = user.InterView.find(
      (interview) => interview.companyName === companyName
    );

    if (existingInterview) {
      return res.status(400).json({ message: "Exists" });
    }
    user.InterView.push({
      companyName,
      currentWeek: 1,
      currentQuestionLength: 0,
    });
    await user.save();
    res.status(200).json({
      message: "Interview entry added successfully",
      User: user.InterView,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Set question length
const setQuestionLength = async (req, res) => {
  const { userId, companyName, currentQuestion, resetWeek = false } = req.body;

  try {
    const user = await User.findById(userId);
    const findCompany = user.InterView.find(
      (comp) => comp.companyName === companyName
    );
    if (findCompany) {
      findCompany.currentQuestionLength = currentQuestion;
      if (resetWeek) {
        findCompany.currentWeek = 1;
      }
      await user.save();
      res.status(200).json({ InterView: user?.InterView });
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating question count", error });
  }
};

// Submit task
const submitTask = async (req, res) => {
  const { userId, companyName } = req.body;

  try {
    const user = await User.findOne({
      _id: userId,
      "InterView.companyName": companyName,
    });
    if (!user) {
      return res.status(404).json({ message: "User or company not found" });
    }
    await User.updateOne(
      { _id: userId, "InterView.companyName": companyName },
      {
        $inc: { "InterView.$.currentWeek": 1 },
        $set: { "InterView.$.currentQuestionLength": 0 },
      }
    );
    const updatedUser = await User.findById(userId);
    const updatedCompany = updatedUser.InterView.find(
      (comp) => comp.companyName === companyName
    );
    res.json({
      week: updatedCompany?.currentWeek || 0,
      userInterView: updatedUser.InterView,
    });
  } catch (error) {
    console.error("SubmitTask Error:", error);
    res.status(500).json({ message: "Error updating week count", error });
  }
};

module.exports = {
  getCompanyDetails,
  getParticularCompany,
  addInterView,
  setQuestionLength,
  submitTask,
};


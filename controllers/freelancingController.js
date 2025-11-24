const User = require("../Models/User");
const Projects = require("../Models/Projects");
const { DB1 } = require("../Database/CCDB");

// Submit project
const submitProject = async (req, res) => {
  try {
    const { projectTitle, description, whatsApp, mobileNumber, skills, uId } =
      req.body;
    console.log(projectTitle, description, whatsApp, mobileNumber, skills, uId);
    if (
      !projectTitle ||
      !description ||
      !uId ||
      !mobileNumber ||
      !whatsApp ||
      !Array.isArray(skills) ||
      skills.length === 0
    ) {
      console.log("all error");
      return res.status(400).json({
        error: "All fields are required and skills must be a non-empty array",
      });
    }

    if (mobileNumber.length !== 10 || whatsApp.length !== 10) {
      console.log("mb error");
      return res
        .status(400)
        .json({ error: "Phone numbers must be exactly 10 digits" });
    }
    const formattedSkills = skills.map((skill) => ({ tech: skill }));
    const newProject = await Projects({
      t: projectTitle,
      d: description,
      mN: mobileNumber,
      pN: whatsApp,
      uId: uId,
      skills: formattedSkills,
    });
    await newProject.save();
    res.status(200).json({
      message: "Project submitted successfully",
    });
  } catch (err) {
    console.error("Error saving project:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const collection = DB1.collection("projects");
    const projects = await collection.find({}).toArray();
    if (projects.length > 0) {
      res.status(200).json({ projects: projects });
    } else {
      res.status(404).json({ message: "No projects found" });
    }
  } catch (error) {
    res.status(400);
  }
};

module.exports = {
  submitProject,
  getAllProjects,
};


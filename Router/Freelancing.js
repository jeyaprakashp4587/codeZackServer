const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const Projects = require("../Models/Projects");

router.post("/submitProject", async (req, res) => {
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
});

module.exports = router;

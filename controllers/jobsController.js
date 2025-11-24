const User = require("../Models/User");
const Jobs = require("../Models/Jobs");
const { DB1 } = require("../Database/CCDB");

// Get all jobs
const getAllJobs = async (req, res) => {
  try {
    const Collection = DB1.collection("Jobs");
    const jobs = await Collection.find().toArray();
    if (jobs.length > 0) {
      console.log(jobs);
      return res.status(200).json(jobs);
    } else {
      return res.status(404).json({ message: "No jobs found." });
    }
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching jobs." });
  }
};

// Post jobs
const postJobs = async (req, res) => {
  const { jobCompany, jobLink, jobImage, jobLocation, Jobtitle, jobPosted } =
    req.body;

  try {
    const newJob = await Jobs({
      jobCompany,
      jobLink,
      jobImage,
      jobLocation,
      Jobtitle,
      jobPosted,
    });
    await newJob.save();
  } catch (error) {}
};

module.exports = {
  getAllJobs,
  postJobs,
};


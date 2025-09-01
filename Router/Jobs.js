const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const Jobs = require("../Models/Jobs");
const { DB1 } = require("../Database/CCDB");
// get all jobs
router.get("/getAllJobs", async (req, res) => {
  try {
    const Collection = DB1.collection("Jobs");
    const jobs = await Collection.find().toArray(); // Await the result
    if (jobs.length > 0) {
      console.log(jobs);
      return res.status(200).json(jobs);
    } else {
      //   console.log("No jobs found.");
      return res.status(404).json({ message: "No jobs found." });
    }
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching jobs." });
  }
});
router.post("/postJobs", async (req, res) => {
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
});
module.exports = router;

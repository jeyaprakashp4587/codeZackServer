const mongoose = require("mongoose");
const { DB1 } = require("../Database/CCDB");
const Schema = mongoose.Schema;

const jobSchema = new Schema({
  jobCompany: String,
  jobLink: String,
  jobImage: String,
  jobLocation: String,
  Jobtitle: String,
  jobPosted: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 7,
  },
});

module.exports = DB1.model("Jobs", jobSchema, "Jobs");

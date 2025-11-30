import mongoose from "mongoose";
import { DB1 } from "../Database/CCDB.js";
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

export default DB1.model("Jobs", jobSchema, "Jobs");

import mongoose from "mongoose";
import { DB1 } from "../Database/CCDB.js";
const Schema = mongoose.Schema;

const freelanceProjectSchema = new Schema({
  t: String,
  d: String,
  skills: [
    {
      tech: String,
    },
  ],
  uId: String,
  mN: String,
  pN: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 7,
  },
});

export default DB1.model("projects", freelanceProjectSchema);

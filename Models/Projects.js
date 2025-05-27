const mongoose = require("mongoose");
const { DB1 } = require("../Database/CCDB");
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

module.exports = DB1.model("projects", freelanceProjectSchema);

const mongoose = require("mongoose");
const { DB1 } = require("../Database/CCDB");

const Chat = new mongoose.Schema({
  senderId: String,
  receiverId: String,
  message: String,
  Time: String,
});
module.exports = DB1.model("chats", Chat);

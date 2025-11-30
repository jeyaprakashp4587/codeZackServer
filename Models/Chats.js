import mongoose from "mongoose";
import { DB1 } from "../Database/CCDB.js";

const Chat = new mongoose.Schema({
  senderId: String,
  receiverId: String,
  message: String,
  Time: String,
});
export default DB1.model("chats", Chat);

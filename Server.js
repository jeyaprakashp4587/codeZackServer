import "dotenv/config"; // Load environment variables first
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import { DB2 } from "./Database/DB.js";
import { DB1 } from "./Database/CCDB.js";
import LogIn from "./Router/Login.js";
import Course from "./Router/Course.js";
import Challenges from "./Router/Challenges.js";
import Profile from "./Router/Profile.js";
import Post from "./Router/Post.js";
import Search from "./Router/Search.js";
import Following from "./Router/Following.js";
import Suggestions from "./Router/Suggestions.js";
import Notification from "./Router/Notification.js";
import initializeSocket from "./Socket/Socket.js";

const app = express();
import compression from "compression";
const server = http.createServer(app);
app.use(bodyParser.json());
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
// init
initializeSocket(server);
// Connect databases
DB1.on("connected", () => {
  console.log("DB1 is connected");
});
DB2.on("connected", () => {
  console.log("DB2 is connected");
});
app.get("/", (req, res) => {
  res.send("server is alive");
});
// Routers
app.use("/auth", LogIn);
app.use("/courses", Course);
app.use("/challenges", Challenges);
app.use("/profile", Profile);
app.use("/posts", Post);
app.use("/search", Search);
app.use("/following", Following);
app.use("/suggestions", Suggestions);
app.use("/notifications", Notification);
// Port listening for
const port = 8080;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

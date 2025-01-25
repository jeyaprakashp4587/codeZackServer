const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { DB2 } = require("./Database/DB");
const { DB1 } = require("./Database/CCDB");
const LogIn = require("./Router/Login");
const Course = require("./Router/Course");
const Challenges = require("./Router/Challenges");
const Profile = require("./Router/Profile");
const Post = require("./Router/Post");
const Search = require("./Router/Search");
const Following = require("./Router/Following");
const Suggestions = require("./Router/Suggestions");
const Activity = require("./Router/Activity");
const Notification = require("./Router/Notification");
const Placement = require("./Router/Placement");
const socket = require("./Socket/Socket");
const Interview = require("./Router/Interview");
const Assignments = require("./Router/Assignments");
const Jobs = require("./Router/Jobs");
const initializeFirebaseAdmin = require("./firebase/firebaseAdmin");

const app = express();
const server = http.createServer(app);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
// initalize firebase admin
initializeFirebaseAdmin();
// start socket
socket(server);
// Connect databases
DB1.on("connected", () => {
  console.log("DB1 is connected");
});

DB2.on("connected", () => {
  console.log("DB2 is connected");
});
// inti cron jobs

// Routers
app.use("/LogIn", LogIn);
app.use("/Courses", Course);
app.use("/Challenges", Challenges);
app.use("/Profile", Profile);
app.use("/Post", Post);
app.use("/Activity", Activity);
app.use("/Search", Search);
app.use("/following", Following);
app.use("/Suggestions", Suggestions);
app.use("/Placements", Placement);
app.use("/Notifications", Notification);
app.use("/Assignment", Assignments);
app.use("/InterView", Interview);
app.use("/Jobs", Jobs);
//
// run cron for delete notes
// Self-ping endpoint
app.get("/check", (req, res) => {
  res.status(200).send("Server is alive!");
});
console.log("aws");
// Port listening
const port = 80;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  // Self-ping every 60 seconds
  //    setInterval(async () => {
  //      try {
  //        await axios.get(`https://codecampusserver-r6gw.onrender.com/ping`);
  //        console.log("Self-ping successful");
  //     } catch (error) {
  //        console.error("Error in self-ping:", error);
  //      }
  //  }, 300000); // Ping every 60 seconds
});

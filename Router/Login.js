const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
// const client = require("../Redis/RedisServer");
// router splash
router.post("/splash", async (req, res) => {
  const { Email } = req.body;
  if (!Email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const user = await User.findOne(
      { Email },
      {
        Notifications: 0,
        ConnectionsPost: 0,
        Assignments: 0,
        Posts: 0,
      }
    ).lean();
    if (user) {
      // Cache the user data in Redis
      // await client?.set(`user:${Email}`, JSON.stringify(user));
      user.Challenges =
        user.Challenges?.filter(
          (challenge) => challenge.status === "completed"
        ) || [];
      return res.status(200).json({ user });
    } else {
      console.log("User not found");
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error querying the database:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});
// SignIn route
router.post("/signIn", async (req, res) => {
  const { Email, Password } = req.body;
  try {
    // Validate input
    if (!Email || !Password) {
      return res
        .status(400)
        .json({ error: "Email and Password are required." });
    }
    // Convert the email to lowercase
    const lowerCaseEmail = Email.toLowerCase().trim();
    // Find the user by email
    const findEmailUser = await User.findOne(
      { Email: lowerCaseEmail },
      {
        Notifications: 0,
        Activities: 0,
        ConnectionsPost: 0,
      }
    );
    if (!findEmailUser) {
      return res.status(401).json({ error: "Email or Password is incorrect." });
    }
    // Compare the provided password with the hashed password
    const isPasswordCorrect = bcrypt.compare(Password, findEmailUser.Password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Email or Password is incorrect." });
    }
    // Successful login
    // await client?.set(
    //   `user:${findEmailUser.Email}`,
    //   JSON.stringify(findEmailUser)
    // );
    findEmailUser.Challenges =
      findEmailUser.Challenges?.filter(
        (challenge) => challenge.status === "completed"
      ) || [];
    res.json({ message: "SignIn Successful", user: findEmailUser });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// SignUp route
router.post("/signUp", async (req, res) => {
  // imges for set profile and cover images
  const coverImages = [
    "https://i.ibb.co/d0dBtHy/2148430879.jpg",
    "https://i.ibb.co/sKGscq7/129728.jpg",
  ];
  const boyProfileImages = [
    "https://i.ibb.co/N1q9xbz/boy3.jpg",
    "https://i.ibb.co/N2gGTTk/boy2.jpg",
    "https://i.ibb.co/4RJhQBn/boy1.jpg",
  ];
  const girlProfileImages = [
    "https://i.ibb.co/T8sbxRd/girl2.jpg",
    "https://i.ibb.co/8gPTcpK/girl1.jpg",
    "https://i.ibb.co/s2bB4yj/girl3.jpg",
  ];
  // req body
  const {
    First_Name,
    Last_Name,
    Email,
    Password,
    Gender,
    Date_Of_Birth,
    Degree_name,
    Institute_Name,
    State,
    District,
    Nationality,
  } = req.body;

  // Convert the email to lowercase
  const lowerCaseEmail = Email.toLowerCase().trim();
  const lowerGender = Gender.toLowerCase().trim();
  const hashedPassword = await bcrypt.hash(Password, 10);
  const coverImg = coverImages[Math.floor(Math.random() * coverImages.length)];
  const profileImg =
    lowerGender === "male"
      ? boyProfileImages[Math.floor(Math.random() * boyProfileImages.length)]
      : girlProfileImages[Math.floor(Math.random() * girlProfileImages.length)];
  // Check if the email already exists
  const existMail = await User.findOne({ Email: Email });
  if (existMail) {
    return res.send("Email has Already Been Taken");
  } else {
    const user = await User({
      firstName: First_Name,
      LastName: Last_Name,
      Email: lowerCaseEmail, // Save email in lowercase
      Password: hashedPassword,
      Gender: lowerGender,
      DateOfBirth: Date_Of_Birth,
      Degreename: Degree_name,
      InstitudeName: Institute_Name,
      State: State,
      District: District,
      Nationality: Nationality,
      Images: {
        profile: profileImg ?? null,
        coverImg: coverImg ?? null,
      },
    });
    // Save the user details in signup
    await user.save();
    // create node mailer for welcome message
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "codezacknet@gmail.com",
        pass: "qkdf cvsn pbei jrkm ", // Use App Password here if using Gmail
      },
    });

    // Compose email
    const mailOptions = {
      from: "codezacknet@gmail.com",
      to: lowerCaseEmail,
      subject: "Welcome to CodeZack!",
      html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h1 style="color: #4CAF50;">Welcome to CodeZack, ${First_Name}!</h1>
      <p>Thank you for signing up for <strong>CodeZack</strong>, the ultimate learning hub for coding enthusiasts like you.</p>
      <h2>About CodeZack</h2>
      <p>At CodeZack, we aim to make learning programming languages and software development both fun and accessible. Whether you're a beginner or an expert, you'll find something here for you!</p>
      <h3>Here’s what you can explore:</h3>
      <ul>
        <li><strong>Learn to Code:</strong> Comprehensive tutorials for front-end, back-end, and app development.</li>
        <li><strong>Take Challenges:</strong> Test your skills with coding challenges across various levels.</li>
        <li><strong>Socialize:</strong> Share your achievements, connect with friends, and get inspired by others.</li>
        <li><strong>Job Placements:</strong> Stay updated with job opportunities and placement tips (coming soon).</li>
      </ul>
      <h3>Get Started</h3>
      <p>Log in now and dive into the world of coding. Let’s embark on this exciting journey together!</p>
      <p>If you have any questions, feel free to contact us anytime. We're here to help.</p>
      <p style="margin-top: 20px;">Happy Coding!<br><strong>The CodeZack Team</strong></p>
    </div>
    `,
    };
    await transporter.sendMail(mailOptions);
    //
    res.json({ message: "SignUp Sucessfully", user: user });
  }
});
// sign out
router.post("/signOut/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // const user = await User.findById(id);
    // await client.del(`user:${user.Email}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
});
// get the user details for update when component refresh
router.post("/getUser", async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId, {
    Notifications: 0,
    Activities: 0,
    Posts: 0,
  });
  if (user) {
    user.Challenges =
      user.Challenges?.filter(
        (challenge) => challenge.status === "completed"
      ) || [];
    res.status(200).send(user);
  }
  // console.log("userId", userId);
});
// password verifications
// send resetPass otp
router.post("/sendResetPassOtp", async (req, res) => {
  const { email, otp } = req.body;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "codezacknet@gmail.com",
      pass: "qkdf cvsn pbei jrkm ", // Use App Password here if using Gmail
    },
  });
  // Compose email
  const mailOptions = {
    from: "codezacknet@gmail.com",
    to: email,
    subject: "Password Reset Request",
    html: `
      
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="text-align: center; color: #3a6ea5;">Password Reset Request</h2>
        <p style="font-size: 16px; color: #333;">
          Dear User,
        </p>
        <p style="font-size: 16px; color: #333;">
          We received a request to reset your password. Please use the OTP below to proceed with resetting your password. This OTP is valid for the next 10 minutes.
        </p>
        <div style="text-align: center;display:flex;">
          <p>
          OTP:</p>
          <p style="font-Weight: bold;padding-left:5px;">${otp}</p>
        </div>
        <p style="font-size: 16px; color: #333;">
          If you did not request a password reset, please ignore this email or contact our support team.
        </p>
        <p style="font-size: 16px; color: #333;">Thank you,</p>
        <p style="font-size: 16px; color: #333; font-weight: bold;">The Support Team</p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          If you have any questions, please do not hesitate to contact us at support@example.com.
        </p>
      </div>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error.message);
    res.status(500).send({ error: "Failed to send OTP" });
  }
});
//reset New password
router.post("/resetNewPassword", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }
  try {
    // Find the user by email
    const user = await User.findOne({ Email: email });
    // console.log(user);

    if (!user) {
      console.log("no user found");
      return res.status(404).json({ message: "User not found." });
    } else {
      user.Password = password;
      await user.save();
      return res.status(200).json({ msg: "ok" });
    }
  } catch (error) {
    console.log(err);
  }
});
module.exports = router;

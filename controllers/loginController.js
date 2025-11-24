const User = require("../Models/User");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Splash screen - get user data
const splash = async (req, res) => {
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
        Activities: 0,
      }
    ).lean();
    if (user) {
      if (user.Challenges.length > 0) {
        user.Challenges =
          user.Challenges?.filter(
            (challenge) => challenge.status === "completed"
          ) || [];
      }
      return res.status(200).json({ user });
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// SignIn
const signIn = async (req, res) => {
  const { Email, Password } = req.body;
  try {
    if (!Email || !Password) {
      return res
        .status(400)
        .json({ error: "Email and Password are required." });
    }
    const lowerCaseEmail = Email.toLowerCase().trim();

    const findEmailUser = await User.findOne(
      { Email: lowerCaseEmail },
      {
        Notifications: 0,
        Activities: 0,
        ConnectionsPost: 0,
        Posts: 0,
      }
    );
    if (!findEmailUser) {
      return res.status(401).json({ error: "Email or Password is incorrect." });
    }
    const isPasswordCorrect = await bcrypt.compare(
      Password,
      findEmailUser.Password
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Email or Password is incorrect." });
    }
    findEmailUser.Challenges =
      findEmailUser.Challenges?.filter(
        (challenge) => challenge.status === "completed"
      ) || [];
    res.json({ message: "SignIn Successful", user: findEmailUser });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  const { Email } = req.body;
  console.log(Email);

  try {
    const exists = await User.exists({ Email: Email.toLowerCase() });
    if (exists) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// SignUp
const signUp = async (req, res) => {
  const coverImages = [
    "https://i.ibb.co/d0dBtHy/2148430879.jpg",
    "https://i.ibb.co/sKGscq7/129728.jpg",
    "https://i.ibb.co/1ftwdd2C/2151555015.jpg",
    "https://i.ibb.co/Q7CTPVzG/2151436574.jpg",
    "https://i.ibb.co/SXzRmyKH/108265.jpg",
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
  const {
    firstName: First_Name,
    lastName: Last_Name,
    email: Email,
    password: Password,
    gender: Gender,
    institution: Institute_Name,
    state: State,
    city: District,
    image: image,
  } = req.body;
  try {
    const lowerCaseEmail = Email.toLowerCase().trim();
    const lowerGender = Gender.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(Password, 10);
    const coverImg =
      coverImages[Math.floor(Math.random() * coverImages.length)];
    let profileImg = image?.trim();
    if (!profileImg) {
      profileImg =
        lowerGender === "male"
          ? boyProfileImages[
              Math.floor(Math.random() * boyProfileImages.length)
            ]
          : girlProfileImages[
              Math.floor(Math.random() * girlProfileImages.length)
            ];
    }
    const user = await User({
      firstName: First_Name,
      LastName: Last_Name,
      Email: lowerCaseEmail,
      Password: hashedPassword,
      Gender: lowerGender,
      InstitudeName: Institute_Name,
      State: State,
      District: District,
      Images: {
        profile: profileImg ?? null,
        coverImg: coverImg ?? null,
      },
    });
    await user.save();
    res.status(200).json({ message: "SignUp Sucessfully", user: user });
  } catch (error) {}
};

// Sign out
const signOut = async (req, res) => {
  const { id } = req.params;
  try {
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500);
  }
};

// Get user details
const getUser = async (req, res) => {
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
};

// Send reset password OTP
const sendResetPassOtp = async (req, res) => {
  const { email, otp } = req.body;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
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
    res.status(500).send({ error: "Failed to send OTP" });
  }
};

// Reset new password
const resetNewPassword = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }
  try {
    const user = await User.findOne({ Email: email });

    const hashedPassword = await bcrypt.hash(password, 10);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    } else {
      user.Password = hashedPassword;
      await user.save();
      return res.status(200).json({ msg: "ok" });
    }
  } catch (error) {}
};

module.exports = {
  splash,
  signIn,
  verifyEmail,
  signUp,
  signOut,
  getUser,
  sendResetPassOtp,
  resetNewPassword,
};


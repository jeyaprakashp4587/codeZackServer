const express = require("express");
const axios = require("axios");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { DB1 } = require("../Database/CCDB");

const router = express.Router();

router.post("/getPortfolio", async (req, res) => {
  const { portName, userId, userEmail, userData } = req.body;
  if (!portName || !userId || !userEmail) {
    return res.status(400).send("Missing required fields");
  }

  const tempDir = path.join(__dirname, "temp", userId);
  const zipOutputPath = path.join(__dirname, "temp", `${userId}-modified.zip`);

  try {
    // Step 1: Fetch portfolio
    const collection = DB1.collection("Portfolios");
    const portfolio = await collection.findOne({ portfolioName: portName });
    if (!portfolio) return res.status(404).send("Portfolio not found");

    const { portfolioZip, portfolioName } = portfolio;
    const { name, image, details } = userData;
    // Step 2: Download ZIP
    const zipRes = await axios.get(portfolioZip, {
      responseType: "arraybuffer",
    });
    const zipBuffer = Buffer.from(zipRes.data, "binary");
    const zip = new AdmZip(zipBuffer);

    // Step 3: Extract
    if (fs.existsSync(tempDir))
      fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });
    zip.extractAllTo(tempDir, true);

    // Step 4: Modify config.js
    const configPath = path.join(tempDir, "config.js");
    const configContent = `
      window.userConfig = {
        name: "${name || portfolioName || "User"}",
        image: "${image || ""}",
        details: "${details || ""}"
      };
    `;
    fs.writeFileSync(configPath, configContent.trim());

    // Step 5: Re-zip
    const modifiedZip = new AdmZip();
    modifiedZip.addLocalFolder(tempDir);
    modifiedZip.writeZip(zipOutputPath);

    // Step 6: Send Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "codezacknet@gmail.com",
        pass: "qkdf cvsn pbei jrkm ",
      },
    });

    await transporter.sendMail({
      from: "codezacknet@gmail.com",
      to: userEmail,
      subject: "Your Modified Portfolio",
      text: "Hi! Your portfolio is ready. Please find the attached ZIP file.",
      attachments: [
        {
          filename: "modified_portfolio.zip",
          path: zipOutputPath,
        },
      ],
    });

    // Step 7: Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(zipOutputPath);

    res.send("Portfolio sent to your email!");
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).send("Something went wrong while processing your request.");
  }
});

module.exports = router;

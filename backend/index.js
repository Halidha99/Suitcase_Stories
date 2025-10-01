require("dotenv").config();
const config = require("./config.json");
const mongoose = require("mongoose");


const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model");
const { authenticateToken } = require("./utilities");

mongoose.connect(config.connectionString);


const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// create user acount
app.post("/create-account", async (req, res) => {
  // create API
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(200)
      .json({ error: true, message: "All input is required" });
  }

  const isUser = await User.findOne({ email });
  if (isUser) {
    return res
      .status(400)
      .json({ error: true, message: "User already exists" });
  }

  const encryptedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    fullName,
    email,
    password: encryptedPassword,
  });

  await user.save();

  const accessToken = jwt.sign(
    { userId: user.id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "72h",
    }
  );

  return res.status(201).json({
    error: false,
    user: { fullName: user.fullName, email: user.email },
    accessToken,
    message: "Registration successfull",

  });
});

// login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All input required" });

  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const accessToken = jwt.sign(
    { userId: user.id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "72h",
    }
  );
  return res.json({
    error: false,
    message: "Login successful",
    user: { fullName: user.fullName, email: user.email },
    accessToken,
  });
  
});

// Get User
app.get("/get-user", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Fixed destructuring

  const isUser = await User.findOne({ _id: userId });

  if (!isUser) {
    return res.sendStatus(401);
  }
  return res.json({
    user: isUser,
    message: "",
  });
});

// Start server
app.listen(8000);
 
  module.exports = app;
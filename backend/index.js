require("dotenv").config();
const config = require("./config.json");
const mongoose = require("mongoose");


const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model");

mongoose.connect(config.connectionString);


const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// Test API
// app.get("/hello", async (req, res) => {
//   return res.status(200).json({ message: "hello" });
// });


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
      expiresIn: "24h",
    }
  );

  return res.status(201).json({
    error: false,
    user: { fullName: user.fullName, email: user.email },
    accessToken,
    message: "Registration successfull",

  });
});
// Start server
app.listen(8000);
 
  module.exports = app;
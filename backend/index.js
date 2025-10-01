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
app.get("/create-account", async (req, res) => {
  
});
// Start server
app.listen(8000);
 
module.exports = app;

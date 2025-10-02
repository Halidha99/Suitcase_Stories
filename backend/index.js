require("dotenv").config();
const config = require("./config.json");
const mongoose = require("mongoose");


const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const upload = require("./multer");
const fs = require("fs");
const path = require("path");


const User = require("./models/user.model");

const Travelstory = require("./models/travelStory.model");
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

// Add Travel Story
app.post("/add-travel-story", authenticateToken, async (req, res) => {
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;

  const { userId } = req.user;

  // validate  required field
if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
  return res.status(400).json({ error: true, message: "All input are required" });
}
  // Convert visitedDate from milliseconds to Date Object
  const pasteVisitedDate = new Date(parseInt(visitedDate));

  try {
    const travelStory = new Travelstory({
      title,
      story,
      visitedLocation,
      imageUrl,
      visitedDate: pasteVisitedDate,
      userId,
    });

    await travelStory.save();
    return res.status(201).json({
      story: travelStory, message: 'Travel Story added successfully'
    });
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }

  });

  // EditTravel Story
app.post("/edit-travel-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { userId } = req.user;

  // validate  required field
  if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
    return res.status(400).json({ error: true, message: "All input are required" });
  }
  // Convert visitedDate from milliseconds to Date Object
  const pasteVisitedDate = new Date(parseInt(visitedDate));

  try {
    // find the travel story by ID and ensure it belongs to the authenticated user
    
    const travelStory = await Travelstory.findOne({ _id: id, userId: userId });
    if (!travelStory) {
      return res.status(400).json({ error: true, message: "Travel story not found" });
      
    }
    const logoImgUrl = `http://localhost:8000/assets/logo.png`;

    travelStory.title = title;
    travelStory.story = story;
    travelStory.visitedLocation = visitedLocation;
    travelStory.imageUrl = imageUrl || logoImgUrl;
    travelStory.visitedDate = pasteVisitedDate;

    await travelStory.save();
    res.status(200).json({ story: travelStory, message: "Updated Successfully" });
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }

});

//  Get All Travel Stories 
app.get("/get-all-stories", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const travelStories = await Travelstory.find({
      userId: userId
    }).sort({ isFavourite: -1, });
    res.status(200).json({ stories: travelStories });
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }
});

// Route to handle image upload
app.post("/image-upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: "No image uploaded" });
    }
    const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`; 
    res.status(201).json({ imageUrl });
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }
});

// delete image from upload folder
app.delete("/delete-image", async (req, res) => {
  const { imageUrl } = req.query;

  if (!imageUrl) {
    return res.status(400).json({ error: true, message: "imageUrl parameter is required" })
  }

  // Extract the filename from the imageUrl
  try {
    const filename = path.basename(imageUrl);

    // Define the file path
    const filePath = path.join(__dirname, 'uploads', filename);

    // Check if the file exists

    if (fs.existsSync(filePath)) {
      //  Delete the file from the upload folder

      fs.unlinkSync(filePath);
      res.status(200).json({ message: "Image deleted successfully" });
    } else {
      res.status(200).json({ error: true, message: "Image not found" });

    }
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
    }
});

// Serve static files from the upload and assets directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

  
  

// Start server
app.listen(8000);
 
  module.exports = app;
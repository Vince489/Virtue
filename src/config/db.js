require("dotenv").config();
const mongoose = require("mongoose");

const { MONGODB_URI } = process.env;

// Function to establish database connection
const connectToDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to Database");
  } catch (error) {
    console.error("Error connecting to database:", error);
    // Ensure the application exits if the database connection fails
    process.exit(1);
  }
};

// Export a function to connect to the database
module.exports = connectToDB;

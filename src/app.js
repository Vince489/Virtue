const connectToDB = require("./config/db");
const express = require("express");

const routes = require("./routes");
const app = express();

app.use(express.json());

// API routes
app.use("/api/v2", routes);

// Handle 404 for API routes
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Connect to the database
connectToDB();



module.exports = { app };

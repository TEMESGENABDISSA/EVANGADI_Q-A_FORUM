require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// DB connection
const dbConnection = require("./config/dbConfig");
// CORS
app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);

// JSON parser (must be BEFORE routes)
app.use(express.json());

const userRoutes = require("./routes/userRoutes");
app.use("/api/v1/user", userRoutes);

const questionRoutes = require("./routes/questionRoute");
app.use("/api/v1", questionRoutes);




const answerRoutes = require("./routes/answerRoute");
app.use("/api/v1", answerRoutes);

// --------------------
// TEST ROOT
// --------------------
app.get("/", (req, res) => {
  res.status(200).send("this is  Evangadi forum");
});

//start server
async function start() {
  try {
    await dbConnection.execute("SELECT 'test'");
    console.log("Database connected successfully");
    await app.listen(port);
    console.log(`Server running at http://localhost:${port}`);
  } catch (err) {
    console.error(err.message);
  }
}

start();

const express = require("express");
const {
  getAnswer,
  postAnswer,
  voteAnswer,
  editAnswer,
  deleteAnswer,
  markAsAccepted,
} = require("../controller/answerController");
const router = express.Router();

// Get Answers for a Question
router.get("/answer/:question_id", getAnswer);

// Post Answers for a Question
router.post("/answer", postAnswer);

// Vote on an Answer
router.post("/answer/vote", voteAnswer);

// Edit an Answer
router.put("/answer", editAnswer);

// Delete an Answer
router.delete("/answer", deleteAnswer);

// Mark answer as accepted
router.post("/answer/accept", markAsAccepted);

module.exports = router;

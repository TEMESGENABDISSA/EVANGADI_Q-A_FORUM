const express = require("express");
const router = express.Router();

const {
  postQuestion,
  getAllQuestions,
  getQuestionAndAnswer,
  editQuestion,
  deleteQuestion,
  incrementViewCount,
} = require("../controller/questionController");

// get all questions
router.get("/questions", getAllQuestions);

// get single question
router.get("/question/:questionId", getQuestionAndAnswer);

// post a question
router.post("/question", postQuestion);

// edit a question
router.put("/question", editQuestion);

// delete a question
router.delete("/question", deleteQuestion);

// increment view count
router.post("/question/:questionId/view", incrementViewCount);

module.exports = router;

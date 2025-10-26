const { StatusCodes } = require("http-status-codes");
const dbConnection = require("../config/dbConfig");
const crypto = require("crypto");

// post questions / ask questions
async function postQuestion(req, res) {
  const { userid, title, description, tag } = req.body;
  // Create a new date object
  const currentTimestamp = new Date();

  // Adjust the time by UTC+3 hours
  const adjustedDate = new Date(
    currentTimestamp.getTime() + 3 * 60 * 60 * 1000
  );

  // Format the date as 'YYYY-MM-DD HH:mm:ss'
  const formattedTimestamp = adjustedDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  if (!userid || !title || !description) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }
  const questionid = crypto.randomBytes(10).toString("hex");
  try {
    await dbConnection.query(
      "insert into questions (questionid, userid, title, description, tag,createdAt) values ( ?, ?, ?, ?, ?,?)",
      [questionid, userid, title, description, tag, formattedTimestamp]
    );
    return res
      .status(StatusCodes.CREATED)
      .json({ message: "question posted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong, please try again later" + err });
  }
}

// get all questions
async function getAllQuestions(req, res) {
  try {
    const [questions] =
      await dbConnection.query(`select q.questionid, q.title, q.description,q.createdAt, u.username from questions q   
     inner join users u on q.userid = u.userid  order by q.createdAt desc`);
    return res.status(StatusCodes.OK).json({
      message: questions,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "something went wrong, please try again later" });
  }
}

// get single question and answers
async function getQuestionAndAnswer(req, res) {
  const questionid = req.params.questionId;

  try {
    const [rows] = await dbConnection.query(
      `SELECT 
          q.questionid, 
          q.title, 
          q.description, 
          q.createdAt AS question_createdAt,
          q.view_count,
          u2.username as question_username,
          a.answerid, 
          a.userid AS answer_userid, 
          a.answer,
          a.createdAt,
          u.username as answer_username
       FROM 
          questions q   
       LEFT JOIN 
          answers a ON q.questionid = a.questionid
          LEFT JOIN users u on u.userid = a.userid
          left join users u2 on u2.userid = q.userid
       WHERE 
          q.questionid = ?
          order by a.createdAt desc
          `,
      [questionid]
    );

    // Check if the question exists
    if (rows.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Question not found" });
    }

    // Reshape the data to include answers under the question
    const questionDetails = {
      id: rows[0].questionid,
      title: rows[0].title,
      description: rows[0].description,
      qtn_createdAt: rows[0].question_createdAt,
      qtn_username: rows[0].question_username,
      view_count: rows[0].view_count || 0,
      answers: rows
        .map((answer) => ({
          answerid: answer.answerid,
          userid: answer.answer_userid,
          username: answer.answer_username,
          answer: answer.answer,
          createdAt: answer.createdAt,
        }))
        .filter((answer) => answer.answerid !== null), // Filter out any null answers
    };

    res.status(StatusCodes.OK).json(questionDetails);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching question details" + error });
  }
}
// Edit a question
async function editQuestion(req, res) {
  const { questionid, userid, title, description, tag } = req.body;

  if (!questionid || !userid || !title || !description) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }

  try {
    // Check if user owns the question
    const [question] = await dbConnection.query(
      "SELECT userid FROM questions WHERE questionid = ?",
      [questionid]
    );

    if (question.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Question not found" });
    }

    if (question[0].userid !== userid) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "You can only edit your own questions" });
    }

    // Update the question
    await dbConnection.query(
      "UPDATE questions SET title = ?, description = ?, tag = ? WHERE questionid = ?",
      [title, description, tag, questionid]
    );

    return res
      .status(StatusCodes.OK)
      .json({ message: "Question updated successfully" });
  } catch (err) {
    console.error("Error editing question:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
}

// Delete a question
async function deleteQuestion(req, res) {
  const { questionid, userid } = req.body;

  if (!questionid || !userid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Question ID and User ID are required" });
  }

  try {
    // Check if user owns the question
    const [question] = await dbConnection.query(
      "SELECT userid FROM questions WHERE questionid = ?",
      [questionid]
    );

    if (question.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Question not found" });
    }

    if (question[0].userid !== userid) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "You can only delete your own questions" });
    }

    // Delete associated answers first (foreign key constraint)
    await dbConnection.query("DELETE FROM answers WHERE questionid = ?", [
      questionid,
    ]);

    // Delete the question
    await dbConnection.query("DELETE FROM questions WHERE questionid = ?", [
      questionid,
    ]);

    return res
      .status(StatusCodes.OK)
      .json({ message: "Question deleted successfully" });
  } catch (err) {
    console.error("Error deleting question:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
}

// Increment view count for a question
async function incrementViewCount(req, res) {
  const { questionId } = req.params;

  try {
    await dbConnection.query(
      "UPDATE questions SET view_count = COALESCE(view_count, 0) + 1 WHERE questionid = ?",
      [questionId]
    );

    return res.status(StatusCodes.OK).json({ message: "View count updated" });
  } catch (err) {
    console.error("Error incrementing view count:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
}

module.exports = {
  postQuestion,
  getAllQuestions,
  getQuestionAndAnswer,
  editQuestion,
  deleteQuestion,
  incrementViewCount,
};

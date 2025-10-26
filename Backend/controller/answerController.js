const { StatusCodes } = require("http-status-codes");
const dbConnection = require("../config/dbConfig");
const crypto = require("crypto");
const { createNotification } = require("./notificationController");

// Get Answers for a Question
async function getAnswer(req, res) {
  const questionid = req.params.question_id;
  try {
    const [rows] = await dbConnection.query(
      `SELECT 
          a.answerid, 
          a.userid AS answer_userid, 
          a.answer,
          a.createdAt,
          a.is_accepted,
          u.username,
          COALESCE(v.vote_count, 0) as vote_count
       FROM 
          answers a 
          INNER JOIN users u ON a.userid = u.userid
          LEFT JOIN (
            SELECT answerid, SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END) as vote_count
            FROM answer_votes 
            GROUP BY answerid
          ) v ON a.answerid = v.answerid
       WHERE 
          a.questionid = ?
       ORDER BY a.is_accepted DESC, vote_count DESC, a.createdAt ASC`,
      [questionid]
    );
    return res.status(StatusCodes.OK).json({ rows });
  } catch (err) {
    console.error("❌ Error fetching answers:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
}

// Post Answers for a Question
async function postAnswer(req, res) {
  const { userid, answer, questionid } = req.body;

  // ✅ Create a UTC+3 timestamp
  const currentTimestamp = new Date();
  const adjustedDate = new Date(
    currentTimestamp.getTime() + 3 * 60 * 60 * 1000
  );
  const formattedTimestamp = adjustedDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  // ✅ Validate
  if (!userid || !answer || !questionid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }

  // ✅ Generate unique answerid
  const answerid = crypto.randomBytes(10).toString("hex");

  try {
    await dbConnection.query(
      "INSERT INTO answers (answerid, userid, questionid, answer, createdAt) VALUES (?, ?, ?, ?, ?)",
      [answerid, userid, questionid, answer, formattedTimestamp]
    );

    // Get question owner to send notification
    const [questionOwner] = await dbConnection.query(
      "SELECT userid, title FROM questions WHERE questionid = ?",
      [questionid]
    );

    if (questionOwner.length > 0 && questionOwner[0].userid !== userid) {
      // Create notification for question owner
      await createNotification(
        questionOwner[0].userid,
        "answer",
        "New answer to your question",
        `Someone has answered your question: "${questionOwner[0].title}"`,
        questionid,
        answerid
      );
    }

    console.log("✅ Answer posted successfully");
    return res
      .status(StatusCodes.CREATED)
      .json({ message: "Answer posted successfully" });
  } catch (err) {
    console.error("❌ Error posting answer:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
}

// Vote on an Answer
async function voteAnswer(req, res) {
  const { answerid, userid, voteType } = req.body; // voteType: 'up' or 'down'

  if (!answerid || !userid || !voteType) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }

  if (!["up", "down"].includes(voteType)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Vote type must be 'up' or 'down'" });
  }

  try {
    // Check if user already voted on this answer
    const [existingVote] = await dbConnection.query(
      "SELECT vote_type FROM answer_votes WHERE answerid = ? AND userid = ?",
      [answerid, userid]
    );

    if (existingVote.length > 0) {
      // Update existing vote
      if (existingVote[0].vote_type === voteType) {
        // Same vote - remove it
        await dbConnection.query(
          "DELETE FROM answer_votes WHERE answerid = ? AND userid = ?",
          [answerid, userid]
        );
        return res.status(StatusCodes.OK).json({ message: "Vote removed" });
      } else {
        // Different vote - update it
        await dbConnection.query(
          "UPDATE answer_votes SET vote_type = ? WHERE answerid = ? AND userid = ?",
          [voteType, answerid, userid]
        );
        return res.status(StatusCodes.OK).json({ message: "Vote updated" });
      }
    } else {
      // New vote
      await dbConnection.query(
        "INSERT INTO answer_votes (answerid, userid, vote_type) VALUES (?, ?, ?)",
        [answerid, userid, voteType]
      );
      return res.status(StatusCodes.CREATED).json({ message: "Vote recorded" });
    }
  } catch (err) {
    console.error("❌ Error voting on answer:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
}

// Edit an answer
async function editAnswer(req, res) {
  const { answerid, userid, answer } = req.body;

  if (!answerid || !userid || !answer) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }

  try {
    // Check if user owns the answer
    const [existingAnswer] = await dbConnection.query(
      "SELECT userid FROM answers WHERE answerid = ?",
      [answerid]
    );

    if (existingAnswer.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Answer not found" });
    }

    if (existingAnswer[0].userid !== userid) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "You can only edit your own answers" });
    }

    // Update the answer
    await dbConnection.query(
      "UPDATE answers SET answer = ? WHERE answerid = ?",
      [answer, answerid]
    );

    return res
      .status(StatusCodes.OK)
      .json({ message: "Answer updated successfully" });
  } catch (err) {
    console.error("Error editing answer:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
}

// Delete an answer
async function deleteAnswer(req, res) {
  const { answerid, userid } = req.body;

  if (!answerid || !userid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Answer ID and User ID are required" });
  }

  try {
    // Check if user owns the answer
    const [existingAnswer] = await dbConnection.query(
      "SELECT userid FROM answers WHERE answerid = ?",
      [answerid]
    );

    if (existingAnswer.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Answer not found" });
    }

    if (existingAnswer[0].userid !== userid) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "You can only delete your own answers" });
    }

    // Delete associated votes first
    await dbConnection.query("DELETE FROM answer_votes WHERE answerid = ?", [
      answerid,
    ]);

    // Delete the answer
    await dbConnection.query("DELETE FROM answers WHERE answerid = ?", [
      answerid,
    ]);

    return res
      .status(StatusCodes.OK)
      .json({ message: "Answer deleted successfully" });
  } catch (err) {
    console.error("Error deleting answer:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
}

// Mark answer as accepted
async function markAsAccepted(req, res) {
  const { answerid, questionid, userid } = req.body;

  if (!answerid || !questionid || !userid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Answer ID, Question ID, and User ID are required" });
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
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "Only the question owner can mark answers as accepted",
      });
    }

    // First, unmark any previously accepted answer for this question
    await dbConnection.query(
      "UPDATE answers SET is_accepted = 0 WHERE questionid = ?",
      [questionid]
    );

    // Mark the selected answer as accepted
    await dbConnection.query(
      "UPDATE answers SET is_accepted = 1 WHERE answerid = ? AND questionid = ?",
      [answerid, questionid]
    );

    return res
      .status(StatusCodes.OK)
      .json({ message: "Answer marked as accepted" });
  } catch (err) {
    console.error("Error marking answer as accepted:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
}

module.exports = {
  getAnswer,
  postAnswer,
  voteAnswer,
  editAnswer,
  deleteAnswer,
  markAsAccepted,
};

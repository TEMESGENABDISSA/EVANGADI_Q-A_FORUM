const { pool: dbConnection } = require("../config/dbConfig");
const { StatusCodes } = require("http-status-codes");

// Get notifications for a user
const getNotifications = async (req, res) => {
  const { userid } = req.params;

  if (!userid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "User ID is required" });
  }

  try {
    const [notifications] = await dbConnection.query(
      `SELECT 
        n.notificationid as id,
        n.type,
        n.title,
        n.message,
        n.related_question_id,
        n.related_answer_id,
        n.is_read,
        n.created_at,
        q.title as question_title
      FROM notifications n
      LEFT JOIN questions q ON n.related_question_id = q.questionid
      WHERE n.userid = ?
      ORDER BY n.created_at DESC
      LIMIT 50`,
      [userid]
    );

    return res.status(StatusCodes.OK).json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications:", {
      message: err.message,
      sql: err.sql,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      stack: err.stack
    });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error fetching notifications",
      error: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        code: err.code,
        sql: err.sql
      } : {}
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const { userid } = req.body;

  if (!notificationId || !userid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Notification ID and User ID are required" });
  }

  try {
    await dbConnection.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND userid = ?",
      [notificationId, userid]
    );

    return res
      .status(StatusCodes.OK)
      .json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
  const { userid } = req.body;

  if (!userid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "User ID is required" });
  }

  try {
    await dbConnection.query(
      "UPDATE notifications SET is_read = 1 WHERE userid = ?",
      [userid]
    );

    return res
      .status(StatusCodes.OK)
      .json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  const { notificationId } = req.params;
  const { userid } = req.body;

  if (!notificationId || !userid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Notification ID and User ID are required" });
  }

  try {
    await dbConnection.query(
      "DELETE FROM notifications WHERE id = ? AND userid = ?",
      [notificationId, userid]
    );

    return res.status(StatusCodes.OK).json({ message: "Notification deleted" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  const { userid } = req.params;

  if (!userid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "User ID is required" });
  }

  try {
    const [result] = await dbConnection.query(
      "SELECT COUNT(*) as unread_count FROM notifications WHERE userid = ? AND is_read = 0",
      [userid]
    );

    return res
      .status(StatusCodes.OK)
      .json({ unreadCount: result[0].unread_count });
  } catch (err) {
    console.error("Error getting unread count:", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong, please try again later" });
  }
};

// Create notification (internal function)
const createNotification = async (
  userid,
  type,
  title,
  message,
  questionId = null,
  answerId = null
) => {
  try {
    await dbConnection.query(
      "INSERT INTO notifications (userid, type, title, message, related_question_id, related_answer_id) VALUES (?, ?, ?, ?, ?, ?)",
      [userid, type, title, message, questionId, answerId]
    );
  } catch (err) {
    console.error("Error creating notification:", err);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification,
};

const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require("../controller/notificationController");

// GET /api/v1/notifications/:userid - Get notifications for a user
router.get("/notifications/:userid", getNotifications);

// PUT /api/v1/notifications/:notificationId/read - Mark notification as read
router.put("/notifications/:notificationId/read", markAsRead);

// PUT /api/v1/notifications/read-all - Mark all notifications as read
router.put("/notifications/read-all", markAllAsRead);

// DELETE /api/v1/notifications/:notificationId - Delete notification
router.delete("/notifications/:notificationId", deleteNotification);

// GET /api/v1/notifications/:userid/unread-count - Get unread notification count
router.get("/notifications/:userid/unread-count", getUnreadCount);

module.exports = router;

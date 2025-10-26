import React, { useState, useEffect, useContext } from "react";
import { FaBell, FaTimes } from "react-icons/fa";
import { axiosInstance } from "../../utility/axios";
import { UserState } from "../../App";
import { useTheme } from "../../context/ThemeContext";
import styles from "./notificationBell.module.css";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(UserState);
  const { isDarkMode } = useTheme();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.userid) return;

    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/notifications/${user.userid}`);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user?.userid) return;

    try {
      const response = await axiosInstance.get(
        `/notifications/${user.userid}/unread-count`
      );
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/notifications/${notificationId}/read`, {
        userid: user.userid,
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: 1 } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axiosInstance.put("/notifications/read-all", {
        userid: user.userid,
      });

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: 1 }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await axiosInstance.delete(`/notifications/${notificationId}`, {
        data: { userid: user.userid },
      });

      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Load notifications when component mounts or user changes
  useEffect(() => {
    if (user?.userid) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user?.userid]);

  // Refresh notifications every 30 seconds
  useEffect(() => {
    if (!user?.userid) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.userid]);

  // Don't render if user is not logged in
  if (!user?.userid) return null;

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Close the notification panel
    setIsOpen(false);

    // Navigate to question if available
    if (notification.related_question_id) {
      // Use React Router navigation instead of window.location
      window.location.href = `/question/${notification.related_question_id}`;
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className={styles.notificationContainer}>
      {/* Notification Bell */}
      <button
        className={`${styles.bellButton} ${
          isDarkMode ? styles.dark : styles.light
        }`}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div
          className={`${styles.dropdown} ${
            isDarkMode ? styles.dark : styles.light
          }`}
        >
          <div className={styles.header}>
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className={styles.markAllRead} onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
            >
              <FaTimes />
            </button>
          </div>

          <div className={styles.content}>
            {isLoading ? (
              <div className={styles.loading}>Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>
                <FaBell className={styles.emptyIcon} />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className={styles.notificationsList}>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${styles.notificationItem} ${
                      !notification.is_read ? styles.unread : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={styles.notificationContent}>
                      <h4 className={styles.title}>{notification.title}</h4>
                      <p className={styles.message}>{notification.message}</p>
                      <span className={styles.time}>
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <div className={styles.actions}>
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        title="Delete notification"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

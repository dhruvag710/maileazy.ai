import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './NotificationIcon.css';

const NotificationIcon = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [reminders, setReminders] = useState([]);

  const checkNotifications = async () => {
    try {
      const userId = localStorage.getItem('userId');
      console.log('Checking notifications for userId:', userId);
      
      if (!userId) {
        console.log('No userId found in localStorage');
        return;
      }

      console.log('Fetching reminders from:', `http://localhost:4000/api/reminders/${userId}`);
      const response = await axios.get(`http://localhost:4000/api/reminders/${userId}`);
      console.log('Reminders response:', response.data);
      
      setNotificationCount(response.data.length);
      setReminders(response.data);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkNotifications();

    // Then check every minute
    const interval = setInterval(checkNotifications, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (reminders.length > 0) {
      reminders.forEach(todo => {
        const message = todo.deadline
          ? `⏰ Reminder: You have a pending task - '${todo.task}' (due ${formatDate(todo.deadline)})`
          : `⏰ Reminder: You have a pending task - '${todo.task}'`;

        toast(
          <div>
            {message}
            <button 
              onClick={() => markReminderAsSeen(todo.id)}
              className="toast-button"
            >
              Mark as Seen
            </button>
          </div>,
          {
            position: "top-right",
            autoClose: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true
          }
        );
      });
    } else {
      toast.info('No pending notifications');
    }
  };

  const markReminderAsSeen = async (taskId) => {
    try {
      await axios.post('http://localhost:4000/api/reminders/seen', { taskId });
      toast.dismiss();
      checkNotifications(); // Refresh notification count
    } catch (error) {
      console.error('Error marking reminder as seen:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="notification-icon" onClick={handleClick} title="Click to show reminders">
      <span className="material-icons">notifications</span>
      {notificationCount > 0 && (
        <span className="notification-badge">{notificationCount}</span>
      )}
    </div>
  );
};

export default NotificationIcon; 
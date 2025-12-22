import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Notification = ({ userId, role }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`https://crm.fintradify.com/api/notifications/${userId}`);
        setNotifications(response.data);
      } catch (error) {
        toast.error('Error fetching notifications');
      }
    };
    fetchNotifications();
  }, [userId]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`https://crm.fintradify.com/api/notifications/${id}/read`);
      setNotifications(notifications.map((notif) =>
        notif._id === id ? { ...notif, status: 'read' } : notif
      ));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Error marking notification as read');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notif) => (
            <li
              key={notif._id}
              className={`p-2 border rounded ${
                notif.status === 'unread' ? 'bg-yellow-100' : 'bg-gray-100'
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <span className="font-semibold">{notif.type.toUpperCase()}</span>: {notif.message}
                  <p className="text-sm text-gray-500">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
                {notif.status === 'unread' && (
                  <button
                    onClick={() => markAsRead(notif._id)}
                    className="text-blue-500 hover:underline"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notification;
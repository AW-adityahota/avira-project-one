import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  blogId?: string; 
}


export default function Notify() {
  const { userId, getToken } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  // const [ws, setWs] = useState<WebSocket | null>(null);
  const URL = import.meta.env.VITE_URL;
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

  // Fetch initial notifications
  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(`${URL}/api/user/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(response.data);
        updateUnreadCount(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [userId, getToken, URL]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!userId) return;

    const socket = new WebSocket(`${WS_URL}?userId=${userId}`);
    // setWs(socket);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        setNotifications(prev => [data.data, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    };

  }, [userId]);

  const updateUnreadCount = (notifs: Notification[]) => {
    setUnreadCount(notifs.filter(n => !n.read).length);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = await getToken();
      await axios.patch(`${URL}/api/user/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}`,'Content-Type': 'application/json'  },
        withCredentials: true
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Add navigation logic based on notification type
    if (notification.blogId) {
      navigate(`/blogs/${notification.blogId}`);
    }
    // Add other navigation cases as needed
  };

  const markAllAsRead = async () => {
    try {
      const token = await getToken();
      await axios.patch(`${URL}/api/user/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}`,'Content-Type': 'application/json' },
        withCredentials: true
      });
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 relative"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200"
          >
            <div className="py-1 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <p className="text-sm font-medium text-gray-700">Notifications</p>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              {notifications.length === 0 ? (
                <div className="px-4 py-3 text-center text-sm text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start">
                      {!notification.read && (
                        <span className="h-2 w-2 mt-1.5 mr-2 bg-blue-500 rounded-full"></span>
                      )}
                      <div>
                        <p className="text-sm text-gray-800">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
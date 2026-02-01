import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiHeart, FiUserPlus, FiMessageCircle, FiCheck, FiFileText, FiBook, FiStar } from 'react-icons/fi';
import { useSocket } from '../context/SocketContext';
import Link from 'next/link';

export default function NotificationBell() {
  const { notifications, clearNotifications, markNotificationRead, isConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
        return <FiUserPlus className="w-4 h-4 text-blue-500" />;
      case 'like':
        return <FiHeart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <FiMessageCircle className="w-4 h-4 text-green-500" />;
      case 'new_blog':
        return <FiFileText className="w-4 h-4 text-purple-500" />;
      case 'new_manga':
        return <FiBook className="w-4 h-4 text-orange-500" />;
      case 'new_chapter':
        return <FiStar className="w-4 h-4 text-yellow-500" />;
      default:
        return <FiBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <FiBell className="w-5 h-5 text-gray-600" />
        
        {/* Connection Status Indicator */}
        <span 
          className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
        
        {/* Notification Badge */}
        {notifications.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
          >
            {notifications.length > 9 ? '9+' : notifications.length}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <FiBell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isConnected ? 'Real-time updates are enabled' : 'Connecting...'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification, index) => {
                    const NotificationContent = (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
                      >
                        {notification.image ? (
                          <img 
                            src={notification.image} 
                            alt="" 
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {notification.title && (
                            <p className="text-xs font-semibold text-primary mb-0.5">
                              {notification.title}
                            </p>
                          )}
                          <p className="text-sm text-gray-800 line-clamp-2">
                            {notification.message}
                          </p>
                          {notification.authorName && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              by {notification.authorName}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            markNotificationRead(index);
                          }}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          title="Dismiss"
                        >
                          <FiX className="w-4 h-4 text-gray-400" />
                        </button>
                      </motion.div>
                    );

                    return notification.link ? (
                      <Link 
                        key={index} 
                        href={notification.link}
                        onClick={() => setIsOpen(false)}
                      >
                        {NotificationContent}
                      </Link>
                    ) : (
                      NotificationContent
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-t">
                <p className="text-xs text-gray-500 text-center">
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

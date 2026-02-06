import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiHeart, FiUserPlus, FiMessageCircle, FiCheck, FiFileText, FiBook, FiCheckCircle, FiSettings } from 'react-icons/fi';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

const TABS = [
  { id: 'all', label: 'All', icon: FiBell },
  { id: 'blogs', label: 'Blogs', icon: FiFileText },
  { id: 'likes', label: 'Likes', icon: FiHeart },
  { id: 'follows', label: 'Follows', icon: FiUserPlus },
];

const typeConfig = {
  blog_liked: { icon: FiHeart, color: 'text-red-500', bg: 'bg-red-50' },
  blog_published: { icon: FiFileText, color: 'text-purple-500', bg: 'bg-purple-50' },
  new_follower: { icon: FiUserPlus, color: 'text-blue-500', bg: 'bg-blue-50' },
  new_blog_from_following: { icon: FiBook, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  comment: { icon: FiMessageCircle, color: 'text-green-500', bg: 'bg-green-50' },
  blog_approved: { icon: FiCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  follow: { icon: FiUserPlus, color: 'text-blue-500', bg: 'bg-blue-50' },
  like: { icon: FiHeart, color: 'text-red-500', bg: 'bg-red-50' },
  new_blog: { icon: FiFileText, color: 'text-purple-500', bg: 'bg-purple-50' },
};

export default function NotificationBell() {
  const { notifications: realtimeNotifs, clearNotifications: clearRealtime, markNotificationRead: markRealtimeRead, isConnected } = useSocket();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [dbNotifications, setDbNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(false);
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

  // Fetch notifications from DB when panel opens
  const fetchNotifications = useCallback(async (category = 'all') => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('luvrix_auth_token');
      const params = new URLSearchParams({ category, limit: '30' });
      const res = await fetch(`/api/notifications?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDbNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setCategoryCounts(data.categoryCounts || {});
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) fetchNotifications(activeTab);
  }, [isOpen, activeTab, fetchNotifications]);

  // Refresh count periodically
  useEffect(() => {
    if (!user) return;
    fetchNotifications('all');
    const interval = setInterval(() => fetchNotifications('all'), 60000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  // Also count realtime notifications
  const totalUnread = unreadCount + realtimeNotifs.length;

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('luvrix_auth_token');
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ category: activeTab }),
      });
      clearRealtime();
      fetchNotifications(activeTab);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleMarkOneRead = async (notifId, index, isRealtime) => {
    if (isRealtime) {
      markRealtimeRead(index);
    } else {
      try {
        const token = localStorage.getItem('luvrix_auth_token');
        await fetch(`/api/notifications/${notifId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setDbNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Mark read error:', err);
      }
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Merge realtime + DB notifications
  const allNotifications = [
    ...realtimeNotifs.map((n, i) => ({ ...n, _isRealtime: true, _rtIndex: i, id: `rt_${i}` })),
    ...dbNotifications,
  ];

  // Filter by tab
  const filteredNotifications = activeTab === 'all' 
    ? allNotifications 
    : allNotifications.filter(n => n.category === activeTab);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
        aria-label="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {totalUnread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm"
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl shadow-gray-300/50 border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">{totalUnread}</span>
                )}
              </div>
              {totalUnread > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1">
                  <FiCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex border-b border-gray-100 px-2 pt-1">
              {TABS.map((tab) => {
                const TabIcon = tab.icon;
                const count = tab.id === 'all' ? totalUnread : (categoryCounts[tab.id] || 0);
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all relative ${
                      activeTab === tab.id
                        ? 'text-primary bg-primary/5'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    {tab.label}
                    {count > 0 && (
                      <span className={`min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                        activeTab === tab.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <motion.div layoutId="notifTab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading && filteredNotifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin mx-auto" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="px-4 py-10 text-center text-gray-400">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiBell className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No {activeTab === 'all' ? '' : activeTab + ' '}notifications</p>
                  <p className="text-xs mt-1">
                    {isConnected ? 'You\'re all caught up!' : 'Connecting...'}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredNotifications.map((notification, index) => {
                    const config = typeConfig[notification.type] || { icon: FiBell, color: 'text-gray-500', bg: 'bg-gray-50' };
                    const NotifIcon = config.icon;
                    const isUnread = notification._isRealtime || !notification.read;

                    const NotificationItem = (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        className={`px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer ${
                          isUnread ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-gray-50'
                        }`}
                      >
                        {notification.image ? (
                          <img src={notification.image} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                        ) : (
                          <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                            <NotifIcon className={`w-4 h-4 ${config.color}`} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-snug ${isUnread ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-gray-400">{formatTime(notification.createdAt || notification.timestamp)}</span>
                            {isUnread && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
                          </div>
                        </div>
                        {isUnread && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMarkOneRead(notification.id, notification._rtIndex, notification._isRealtime);
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 mt-1"
                            title="Mark as read"
                          >
                            <FiCheck className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        )}
                      </motion.div>
                    );

                    return notification.link ? (
                      <Link key={notification.id || index} href={notification.link} onClick={() => {
                        handleMarkOneRead(notification.id, notification._rtIndex, notification._isRealtime);
                        setIsOpen(false);
                      }}>
                        {NotificationItem}
                      </Link>
                    ) : (
                      <div key={notification.id || index}>{NotificationItem}</div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-gray-50 border-t flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                {isConnected ? '● Live' : '○ Offline'}
              </span>
              <Link href="/notifications" onClick={() => setIsOpen(false)} className="text-xs text-primary font-semibold hover:text-primary/80">
                View All →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * SocketContext - Stubbed for Static Export
 * Socket.io is not available in static export mode.
 * All functions are no-ops that maintain the same interface.
 */
import { createContext, useContext, useState, useCallback } from 'react';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // All socket functions are no-ops in static export mode
  const noop = useCallback(() => {}, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markNotificationRead = useCallback((index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  const subscribe = useCallback(() => {
    return () => {}; // Return unsubscribe function
  }, []);

  const value = {
    socket: null,
    isConnected: false,
    notifications,
    joinRoom: noop,
    leaveRoom: noop,
    emitBlogView: noop,
    emitBlogLike: noop,
    emitNewComment: noop,
    emitCommentDelete: noop,
    emitCommentLike: noop,
    emitFollow: noop,
    emitMangaView: noop,
    emitMangaFavorite: noop,
    emitTyping: noop,
    emitPageView: noop,
    emitPageLeave: noop,
    joinAdminAnalytics: noop,
    broadcastNotification: noop,
    subscribeToAuthor: noop,
    emitNewContent: noop,
    subscribe,
    clearNotifications,
    markNotificationRead,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;

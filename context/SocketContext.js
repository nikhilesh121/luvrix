import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getApiUrl } from '../lib/api-config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      // First, hit the socket API to initialize the server
      await fetch(getApiUrl('/api/socket'));
      
      const socketInstance = io(API_URL || undefined, {
        path: '/api/socket',
        addTrailingSlash: false,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Join user room if logged in
        if (user?.uid) {
          socketInstance.emit('user:join', user.uid);
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reconnectAttempts.current += 1;
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached');
        }
      });

      // Listen for notifications
      socketInstance.on('notification:new', (notification) => {
        setNotifications(prev => [notification, ...prev].slice(0, 50));
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    };

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Re-join user room when user changes
  useEffect(() => {
    if (socket && isConnected && user?.uid) {
      socket.emit('user:join', user.uid);
    }
  }, [socket, isConnected, user]);

  // Join a room
  const joinRoom = useCallback((room) => {
    if (socket && isConnected) {
      socket.emit('room:join', room);
    }
  }, [socket, isConnected]);

  // Leave a room
  const leaveRoom = useCallback((room) => {
    if (socket && isConnected) {
      socket.emit('room:leave', room);
    }
  }, [socket, isConnected]);

  // Emit blog view
  const emitBlogView = useCallback((blogId, views) => {
    if (socket && isConnected) {
      socket.emit('blog:view', { blogId, views });
    }
  }, [socket, isConnected]);

  // Emit blog like/unlike
  const emitBlogLike = useCallback((blogId, likes, userId, action) => {
    if (socket && isConnected) {
      socket.emit('blog:like', { blogId, likes, userId, action });
    }
  }, [socket, isConnected]);

  // Emit new comment
  const emitNewComment = useCallback((targetId, targetType, comment) => {
    if (socket && isConnected) {
      socket.emit('comment:new', { targetId, targetType, comment });
    }
  }, [socket, isConnected]);

  // Emit comment delete
  const emitCommentDelete = useCallback((targetId, targetType, commentId) => {
    if (socket && isConnected) {
      socket.emit('comment:delete', { targetId, targetType, commentId });
    }
  }, [socket, isConnected]);

  // Emit comment like
  const emitCommentLike = useCallback((targetId, targetType, commentId, likes) => {
    if (socket && isConnected) {
      socket.emit('comment:like', { targetId, targetType, commentId, likes });
    }
  }, [socket, isConnected]);

  // Emit follow
  const emitFollow = useCallback((followerId, followerName, followedId) => {
    if (socket && isConnected) {
      socket.emit('user:follow', { followerId, followerName, followedId });
    }
  }, [socket, isConnected]);

  // Emit manga view
  const emitMangaView = useCallback((mangaId, views) => {
    if (socket && isConnected) {
      socket.emit('manga:view', { mangaId, views });
    }
  }, [socket, isConnected]);

  // Emit manga favorite
  const emitMangaFavorite = useCallback((mangaId, favorites, userId, action) => {
    if (socket && isConnected) {
      socket.emit('manga:favorite', { mangaId, favorites, userId, action });
    }
  }, [socket, isConnected]);

  // Emit typing indicator
  const emitTyping = useCallback((targetId, targetType, userId, userName, isTyping) => {
    if (socket && isConnected) {
      socket.emit('comment:typing', { targetId, targetType, userId, userName, isTyping });
    }
  }, [socket, isConnected]);

  // Emit page view for analytics
  const emitPageView = useCallback((page, userId) => {
    if (socket && isConnected) {
      socket.emit('analytics:pageView', { page, userId });
    }
  }, [socket, isConnected]);

  // Emit page leave for analytics
  const emitPageLeave = useCallback((page) => {
    if (socket && isConnected) {
      socket.emit('analytics:pageLeave', { page });
    }
  }, [socket, isConnected]);

  // Join admin analytics room
  const joinAdminAnalytics = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('admin:joinAnalytics');
    }
  }, [socket, isConnected]);

  // Broadcast notification to all users (for new content)
  const broadcastNotification = useCallback((type, title, message, link, image, authorName) => {
    if (socket && isConnected) {
      socket.emit('notification:broadcast', { type, title, message, link, image, authorName });
    }
  }, [socket, isConnected]);

  // Subscribe to author content updates
  const subscribeToAuthor = useCallback((authorId) => {
    if (socket && isConnected) {
      socket.emit('content:subscribe', authorId);
    }
  }, [socket, isConnected]);

  // Emit new content notification to followers
  const emitNewContent = useCallback((authorId, type, title, message, link, image, authorName) => {
    if (socket && isConnected) {
      socket.emit('content:new', { authorId, type, title, message, link, image, authorName });
    }
  }, [socket, isConnected]);

  // Subscribe to events
  const subscribe = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  }, [socket]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback((index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  const value = {
    socket,
    isConnected,
    notifications,
    joinRoom,
    leaveRoom,
    emitBlogView,
    emitBlogLike,
    emitNewComment,
    emitCommentDelete,
    emitCommentLike,
    emitFollow,
    emitMangaView,
    emitMangaFavorite,
    emitTyping,
    emitPageView,
    emitPageLeave,
    joinAdminAnalytics,
    broadcastNotification,
    subscribeToAuthor,
    emitNewContent,
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

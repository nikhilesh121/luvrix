import { Server } from 'socket.io';

// Global analytics store (persists across requests)
if (!global.socketAnalytics) {
  global.socketAnalytics = {
    liveUsers: new Map(), // socketId -> { userId, page, joinedAt }
    pageViews: new Map(), // page -> Set of socketIds
    watchTime: new Map(), // socketId -> { page, startTime }
    totalSessions: 0,
    totalWatchTime: 0, // in seconds
  };
}

const analytics = global.socketAnalytics;

const SocketHandler = (req, res) => {
  // Handle GET request for analytics data
  if (req.method === 'GET' && req.query.analytics === 'true') {
    const liveUserCount = analytics.liveUsers.size;
    const pageBreakdown = {};
    
    analytics.pageViews.forEach((sockets, page) => {
      pageBreakdown[page] = sockets.size;
    });
    
    // Calculate average watch time
    let avgWatchTime = 0;
    if (analytics.totalSessions > 0) {
      avgWatchTime = Math.round(analytics.totalWatchTime / analytics.totalSessions);
    }
    
    return res.status(200).json({
      liveUsers: liveUserCount,
      pageBreakdown,
      avgWatchTime,
      totalSessions: analytics.totalSessions,
    });
  }

  if (res.socket.server.io) {
    console.log('Socket.io already running');
    res.end();
    return;
  }

  console.log('Setting up Socket.io server...');
  
  const io = new Server(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // User joins with their userId
    socket.on('user:join', (userId) => {
      if (userId) {
        connectedUsers.set(socket.id, userId);
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined`);
      }
    });

    // Track page view for analytics
    socket.on('analytics:pageView', (data) => {
      const { page, userId } = data;
      
      // Update live users
      analytics.liveUsers.set(socket.id, {
        userId: userId || 'anonymous',
        page,
        joinedAt: Date.now(),
      });
      
      // Update page views
      if (!analytics.pageViews.has(page)) {
        analytics.pageViews.set(page, new Set());
      }
      analytics.pageViews.get(page).add(socket.id);
      
      // Track watch time start
      analytics.watchTime.set(socket.id, {
        page,
        startTime: Date.now(),
      });
      
      // Broadcast live user count to admin
      io.to('admin:analytics').emit('analytics:update', {
        liveUsers: analytics.liveUsers.size,
      });
    });

    // Track page leave
    socket.on('analytics:pageLeave', (data) => {
      const { page } = data;
      
      // Calculate watch time
      const watchData = analytics.watchTime.get(socket.id);
      if (watchData) {
        const duration = Math.round((Date.now() - watchData.startTime) / 1000);
        analytics.totalWatchTime += duration;
        analytics.totalSessions += 1;
        analytics.watchTime.delete(socket.id);
      }
      
      // Remove from page views
      if (analytics.pageViews.has(page)) {
        analytics.pageViews.get(page).delete(socket.id);
        if (analytics.pageViews.get(page).size === 0) {
          analytics.pageViews.delete(page);
        }
      }
    });

    // Admin joins analytics room
    socket.on('admin:joinAnalytics', () => {
      socket.join('admin:analytics');
      // Send current stats
      socket.emit('analytics:update', {
        liveUsers: analytics.liveUsers.size,
      });
    });

    // Join a specific room (blog, manga, etc.)
    socket.on('room:join', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Leave a room
    socket.on('room:leave', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    // Blog events
    socket.on('blog:view', (data) => {
      // Broadcast view count update to all users viewing this blog
      io.to(`blog:${data.blogId}`).emit('blog:viewUpdate', {
        blogId: data.blogId,
        views: data.views,
      });
    });

    socket.on('blog:like', (data) => {
      // Broadcast like update to all users viewing this blog
      io.to(`blog:${data.blogId}`).emit('blog:likeUpdate', {
        blogId: data.blogId,
        likes: data.likes,
        userId: data.userId,
        action: data.action, // 'like' or 'unlike'
      });
    });

    // Comment events
    socket.on('comment:new', (data) => {
      // Broadcast new comment to all users viewing this content
      io.to(`${data.targetType}:${data.targetId}`).emit('comment:added', data.comment);
    });

    socket.on('comment:delete', (data) => {
      // Broadcast comment deletion
      io.to(`${data.targetType}:${data.targetId}`).emit('comment:removed', {
        commentId: data.commentId,
      });
    });

    socket.on('comment:like', (data) => {
      // Broadcast comment like update
      io.to(`${data.targetType}:${data.targetId}`).emit('comment:likeUpdate', {
        commentId: data.commentId,
        likes: data.likes,
      });
    });

    // Follow events
    socket.on('user:follow', (data) => {
      // Notify the followed user
      io.to(`user:${data.followedId}`).emit('notification:new', {
        type: 'follow',
        message: `${data.followerName} started following you`,
        userId: data.followerId,
        timestamp: new Date().toISOString(),
      });
    });

    // Notification events
    socket.on('notification:send', (data) => {
      // Send notification to specific user
      io.to(`user:${data.userId}`).emit('notification:new', data.notification);
    });

    // Broadcast notification to all users (for new blogs/manga)
    socket.on('notification:broadcast', (data) => {
      // Broadcast to all connected users
      io.emit('notification:new', {
        type: data.type, // 'new_blog' or 'new_manga'
        title: data.title,
        message: data.message,
        link: data.link,
        image: data.image,
        authorName: data.authorName,
        timestamp: new Date().toISOString(),
      });
    });

    // Subscribe to content updates (for followers)
    socket.on('content:subscribe', (authorId) => {
      socket.join(`author:${authorId}`);
    });

    // Notify followers of new content
    socket.on('content:new', (data) => {
      io.to(`author:${data.authorId}`).emit('notification:new', {
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        image: data.image,
        authorName: data.authorName,
        timestamp: new Date().toISOString(),
      });
    });

    // Manga events
    socket.on('manga:view', (data) => {
      io.to(`manga:${data.mangaId}`).emit('manga:viewUpdate', {
        mangaId: data.mangaId,
        views: data.views,
      });
    });

    socket.on('manga:favorite', (data) => {
      io.to(`manga:${data.mangaId}`).emit('manga:favoriteUpdate', {
        mangaId: data.mangaId,
        favorites: data.favorites,
        userId: data.userId,
        action: data.action,
      });
    });

    // Typing indicator for comments
    socket.on('comment:typing', (data) => {
      socket.to(`${data.targetType}:${data.targetId}`).emit('comment:userTyping', {
        userId: data.userId,
        userName: data.userName,
        isTyping: data.isTyping,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        connectedUsers.delete(socket.id);
        console.log(`User ${userId} disconnected`);
      }
      
      // Clean up analytics
      const watchData = analytics.watchTime.get(socket.id);
      if (watchData) {
        const duration = Math.round((Date.now() - watchData.startTime) / 1000);
        analytics.totalWatchTime += duration;
        analytics.totalSessions += 1;
        analytics.watchTime.delete(socket.id);
      }
      
      analytics.liveUsers.delete(socket.id);
      
      // Clean up from all page views
      analytics.pageViews.forEach((sockets, page) => {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          analytics.pageViews.delete(page);
        }
      });
      
      // Broadcast updated count to admin
      io.to('admin:analytics').emit('analytics:update', {
        liveUsers: analytics.liveUsers.size,
      });
      
      console.log('Client disconnected:', socket.id);
    });
  });

  res.socket.server.io = io;
  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default SocketHandler;

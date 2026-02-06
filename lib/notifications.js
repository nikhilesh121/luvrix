import { getDb } from './mongodb';
import { sendEmail } from '../utils/email';

// Notification types
export const NOTIFICATION_TYPES = {
  BLOG_LIKED: 'blog_liked',
  BLOG_PUBLISHED: 'blog_published',
  NEW_FOLLOWER: 'new_follower',
  NEW_BLOG_FROM_FOLLOWING: 'new_blog_from_following',
  COMMENT: 'comment',
  BLOG_APPROVED: 'blog_approved',
  BLOG_REJECTED: 'blog_rejected',
};

// Category mapping
export const NOTIFICATION_CATEGORIES = {
  [NOTIFICATION_TYPES.BLOG_LIKED]: 'likes',
  [NOTIFICATION_TYPES.BLOG_PUBLISHED]: 'blogs',
  [NOTIFICATION_TYPES.NEW_FOLLOWER]: 'follows',
  [NOTIFICATION_TYPES.NEW_BLOG_FROM_FOLLOWING]: 'blogs',
  [NOTIFICATION_TYPES.COMMENT]: 'blogs',
  [NOTIFICATION_TYPES.BLOG_APPROVED]: 'blogs',
  [NOTIFICATION_TYPES.BLOG_REJECTED]: 'blogs',
};

// Create a notification in DB
export async function createNotification({ userId, type, title, message, link, image, fromUserId, fromUserName, metadata = {} }) {
  const db = await getDb();
  const notification = {
    userId,
    type,
    category: NOTIFICATION_CATEGORIES[type] || 'general',
    title,
    message,
    link: link || null,
    image: image || null,
    fromUserId: fromUserId || null,
    fromUserName: fromUserName || null,
    metadata,
    read: false,
    emailSent: false,
    createdAt: new Date(),
  };

  const result = await db.collection('notifications').insertOne(notification);
  notification._id = result.insertedId;
  return notification;
}

// Get notifications for a user
export async function getUserNotifications(userId, { category = null, limit = 50, skip = 0, unreadOnly = false } = {}) {
  const db = await getDb();
  const filter = { userId };
  if (category && category !== 'all') filter.category = category;
  if (unreadOnly) filter.read = false;

  const notifications = await db.collection('notifications')
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const unreadCount = await db.collection('notifications').countDocuments({ userId, read: false });
  const categoryCounts = await db.collection('notifications').aggregate([
    { $match: { userId, read: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]).toArray();

  return {
    notifications: notifications.map(n => ({ ...n, id: n._id.toString() })),
    unreadCount,
    categoryCounts: Object.fromEntries(categoryCounts.map(c => [c._id, c.count])),
  };
}

// Mark notification as read
export async function markNotificationRead(notificationId) {
  const db = await getDb();
  await db.collection('notifications').updateOne(
    { _id: notificationId },
    { $set: { read: true, readAt: new Date() } }
  );
}

// Mark all notifications as read for a user
export async function markAllNotificationsRead(userId, category = null) {
  const db = await getDb();
  const filter = { userId, read: false };
  if (category && category !== 'all') filter.category = category;
  await db.collection('notifications').updateMany(filter, { $set: { read: true, readAt: new Date() } });
}

// Get unread count
export async function getUnreadCount(userId) {
  const db = await getDb();
  return db.collection('notifications').countDocuments({ userId, read: false });
}

// ============================================
// NOTIFICATION TRIGGERS
// ============================================

// When someone likes a blog → notify the author (replace any existing like notification from same user for same blog)
export async function notifyBlogLiked({ blogId, blogTitle, blogAuthorId, likerId, likerName }) {
  if (blogAuthorId === likerId) return; // Don't notify self-likes

  const db = await getDb();
  // Remove any existing like notification from this user for this blog (prevents spam on like/unlike/like)
  await db.collection('notifications').deleteMany({
    userId: blogAuthorId,
    type: NOTIFICATION_TYPES.BLOG_LIKED,
    fromUserId: likerId,
    'metadata.blogId': blogId,
  });

  const notification = await createNotification({
    userId: blogAuthorId,
    type: NOTIFICATION_TYPES.BLOG_LIKED,
    title: 'New Like!',
    message: `${likerName} liked your blog "${blogTitle}"`,
    link: `/blog?id=${blogId}`,
    fromUserId: likerId,
    fromUserName: likerName,
    metadata: { blogId, blogTitle },
  });

  // Send email (non-blocking)
  sendNotificationEmail(blogAuthorId, notification).catch(console.error);
  return notification;
}

// When someone follows a user → notify the followed user (replace any existing follow notification from same user)
export async function notifyNewFollower({ followedId, followerId, followerName }) {
  if (followedId === followerId) return;

  const db = await getDb();
  // Remove any existing follow notification from this user (prevents spam on follow/unfollow/follow)
  await db.collection('notifications').deleteMany({
    userId: followedId,
    type: NOTIFICATION_TYPES.NEW_FOLLOWER,
    fromUserId: followerId,
  });

  const notification = await createNotification({
    userId: followedId,
    type: NOTIFICATION_TYPES.NEW_FOLLOWER,
    title: 'New Follower!',
    message: `${followerName} started following you`,
    link: `/user/${followerId}`,
    fromUserId: followerId,
    fromUserName: followerName,
  });

  sendNotificationEmail(followedId, notification).catch(console.error);
  return notification;
}

// When a blog is published → notify followers + subscribers
export async function notifyBlogPublished({ blogId, blogTitle, blogCategory, authorId, authorName, thumbnail }) {
  const db = await getDb();

  // Get author's followers
  const follows = await db.collection('follows').find({ followingId: authorId }).toArray();
  const followerIds = follows.map(f => f.followerId);

  // Get subscribers interested in this category
  const subscriberFilter = { active: true, userId: { $nin: [authorId, ...followerIds] } };
  if (blogCategory) {
    subscriberFilter.$or = [
      { categories: { $in: [blogCategory] } },
      { categories: { $size: 0 } },
      { categories: { $exists: false } },
    ];
  }
  const subscribers = await db.collection('subscribers').find(subscriberFilter).toArray();

  const link = `/blog?id=${blogId}`;

  // Notify followers
  const followerNotifications = followerIds.map(fId => createNotification({
    userId: fId,
    type: NOTIFICATION_TYPES.NEW_BLOG_FROM_FOLLOWING,
    title: 'New Blog from ' + authorName,
    message: `${authorName} published "${blogTitle}"`,
    link,
    image: thumbnail,
    fromUserId: authorId,
    fromUserName: authorName,
    metadata: { blogId, blogTitle, blogCategory },
  }));

  // Notify subscribers
  const subscriberNotifications = subscribers.map(sub => createNotification({
    userId: sub.userId,
    type: NOTIFICATION_TYPES.BLOG_PUBLISHED,
    title: 'New Article on Luvrix',
    message: `Check out "${blogTitle}" by ${authorName}`,
    link,
    image: thumbnail,
    fromUserId: authorId,
    fromUserName: authorName,
    metadata: { blogId, blogTitle, blogCategory },
  }));

  await Promise.allSettled([...followerNotifications, ...subscriberNotifications]);

  // Send emails in background (batch, non-blocking)
  sendBlogPublishedEmails({ blogId, blogTitle, blogCategory, authorName, thumbnail, followerIds, subscribers }).catch(console.error);
}

// ============================================
// EMAIL SENDING
// ============================================

async function sendNotificationEmail(userId, notification) {
  const db = await getDb();
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user?.email) return;

  // Check user preferences
  const prefs = user.notificationPrefs || {};
  const categoryPref = prefs[notification.category];
  if (categoryPref === false) return; // User opted out of this category

  const emailHtml = buildNotificationEmail(notification, user.name || 'there');

  try {
    await sendEmail(user.email, { subject: notification.title, html: emailHtml });
    await db.collection('notifications').updateOne(
      { _id: notification._id },
      { $set: { emailSent: true } }
    );
  } catch (err) {
    console.error('Failed to send notification email:', err.message);
  }
}

async function sendBlogPublishedEmails({ blogId, blogTitle, blogCategory, authorName, thumbnail, followerIds, subscribers }) {
  const db = await getDb();

  // Collect all user IDs
  const allUserIds = [...followerIds, ...subscribers.map(s => s.userId)];
  if (allUserIds.length === 0) return;

  const users = await db.collection('users').find({ _id: { $in: allUserIds } }).toArray();
  const userMap = Object.fromEntries(users.map(u => [u._id, u]));

  const emailHtml = buildNewBlogEmail({ blogId, blogTitle, blogCategory, authorName, thumbnail });

  // Send in batches of 10
  for (let i = 0; i < allUserIds.length; i += 10) {
    const batch = allUserIds.slice(i, i + 10);
    await Promise.allSettled(batch.map(async (uid) => {
      const user = userMap[uid];
      if (!user?.email) return;
      const prefs = user.notificationPrefs || {};
      if (prefs.blogs === false) return;
      try {
        await sendEmail(user.email, { subject: `New: ${blogTitle} — Luvrix`, html: emailHtml });
      } catch (err) {
        console.error(`Email to ${user.email} failed:`, err.message);
      }
    }));
  }
}

// ============================================
// EMAIL TEMPLATES (Branded)
// ============================================

function emailWrapper(content) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f2942 50%, #1a1a2e 100%); padding: 32px 30px; text-align: center;">
        <div style="display: inline-block; width: 44px; height: 44px; background: linear-gradient(135deg, #ff0055, #8b5cf6); border-radius: 14px; line-height: 44px; margin-bottom: 12px;">
          <span style="color: #fff; font-size: 22px; font-weight: bold;">⚡</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Luvrix</h1>
        <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Stories & Knowledge</p>
      </div>
      ${content}
      <div style="background: #f8f9fa; padding: 24px 30px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="margin: 0 0 8px; color: #999; font-size: 12px;">You're receiving this because of your notification preferences on Luvrix.</p>
        <p style="margin: 0; color: #666; font-size: 13px;">© ${new Date().getFullYear()} <a href="https://luvrix.com" style="color: #1e3a5f; text-decoration: none; font-weight: 600;">Luvrix</a>. All rights reserved.</p>
      </div>
    </div>
  `;
}

function buildNotificationEmail(notification, userName) {
  const typeConfig = {
    blog_liked: { emoji: '❤️', color: '#ef4444', label: 'Someone loved your work!' },
    new_follower: { emoji: '👤', color: '#3b82f6', label: 'You have a new follower!' },
    comment: { emoji: '💬', color: '#22c55e', label: 'New comment on your blog' },
    blog_approved: { emoji: '✅', color: '#22c55e', label: 'Your blog is live!' },
    blog_rejected: { emoji: '⚠️', color: '#f59e0b', label: 'Blog review update' },
  };

  const config = typeConfig[notification.type] || { emoji: '🔔', color: '#6366f1', label: 'Notification' };
  const link = notification.link ? `https://luvrix.com${notification.link}` : 'https://luvrix.com';

  return emailWrapper(`
    <div style="padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: ${config.color}15; line-height: 56px; font-size: 28px;">${config.emoji}</div>
      </div>
      <p style="font-size: 13px; color: ${config.color}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; text-align: center; margin: 0 0 8px;">${config.label}</p>
      <p style="font-size: 16px; color: #333; line-height: 1.6; text-align: center;">Hi ${userName},</p>
      <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid ${config.color};">
        <p style="font-size: 16px; color: #1e293b; margin: 0; font-weight: 500;">${notification.message}</p>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${link}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #1e3a5f, #0f2942); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">View on Luvrix →</a>
      </div>
    </div>
  `);
}

function buildNewBlogEmail({ blogId, blogTitle, blogCategory, authorName, thumbnail }) {
  const link = `https://luvrix.com/blog?id=${blogId}`;
  const thumbHtml = thumbnail ? `
    <div style="margin: 24px 0; border-radius: 12px; overflow: hidden;">
      <a href="${link}"><img src="${thumbnail}" alt="${blogTitle}" style="width: 100%; height: auto; display: block; border-radius: 12px;" /></a>
    </div>
  ` : '';

  return emailWrapper(`
    <div style="padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 16px;">
        <span style="display: inline-block; padding: 4px 14px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">📰 New Article</span>
      </div>
      ${thumbHtml}
      ${blogCategory ? `<p style="font-size: 12px; color: #6366f1; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px;">${blogCategory}</p>` : ''}
      <h2 style="font-size: 22px; color: #0f172a; margin: 0 0 12px; font-weight: 800; line-height: 1.3;">${blogTitle}</h2>
      <p style="font-size: 14px; color: #64748b; margin: 0 0 24px;">By <strong style="color: #334155;">${authorName}</strong></p>
      <div style="text-align: center;">
        <a href="${link}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #ff0055, #8b5cf6); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(255,0,85,0.3);">Read Article →</a>
      </div>
    </div>
  `);
}

export { buildNewBlogEmail, buildNotificationEmail, emailWrapper };

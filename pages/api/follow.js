import { followUser, unfollowUser, isFollowing } from '../../lib/db';
import { getDb } from '../../lib/mongodb';
import { withCSRFProtection } from '../../lib/csrf';
import { notifyNewFollower } from '../../lib/notifications';

async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { followerId, followingId } = req.query;
      const result = await isFollowing(followerId, followingId);
      return res.status(200).json({ isFollowing: result });
    }
    
    if (req.method === 'POST') {
      const { followerId, followingId } = req.body;
      await followUser(followerId, followingId);

      // Send notification to the followed user
      if (followerId !== followingId) {
        const db = await getDb();
        const follower = await db.collection('users').findOne({ _id: followerId });
        notifyNewFollower({
          followedId: followingId,
          followerId,
          followerName: follower?.name || 'Someone',
        }).catch(console.error);
      }

      return res.status(200).json({ success: true });
    }
    
    if (req.method === 'DELETE') {
      const { followerId, followingId } = req.body;
      await unfollowUser(followerId, followingId);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Follow API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withCSRFProtection(handler);

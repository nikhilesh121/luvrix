import { getDb } from '../../../../../lib/mongodb';
import { verifyToken } from '../../../../../lib/auth';
import { withCSRFProtection } from '../../../../../lib/csrf';
import { withRateLimit } from '../../../../../lib/rateLimit';

async function handler(req, res) {
  // Set proper headers
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const db = await getDb();
    
    // Check if user is admin
    const adminUser = await db.collection('users').findOne({ _id: decoded.uid });
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.query;
    const { points } = req.body;

    if (typeof points !== 'number' || points < 0) {
      return res.status(400).json({ error: 'Invalid points value' });
    }

    // Get current user to check existing points
    const targetUser = await db.collection('users').findOne({ _id: id });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentPoints = targetUser.extraPosts || 0;
    const newTotal = currentPoints + points;

    // ADD points to user's existing extra posts
    const result = await db.collection('users').updateOne(
      { _id: id },
      { 
        $inc: { extraPosts: points },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the action
    await db.collection('logs').insertOne({
      action: 'admin_add_user_points',
      adminId: decoded.uid,
      targetUserId: id,
      previousPoints: currentPoints,
      addedPoints: points,
      newTotal: newTotal,
      createdAt: new Date()
    });

    return res.status(200).json({ 
      success: true, 
      message: `Added ${points} points. New total: ${newTotal}`,
      addedPoints: points,
      newTotal: newTotal
    });
  } catch (error) {
    console.error('Error updating user points:', error);
    return res.status(500).json({ error: 'Failed to update user points' });
  }
}

// Apply admin rate limiting then CSRF protection
export default withRateLimit(withCSRFProtection(handler), 'admin');

import { getDb } from '../../../../../lib/mongodb';
import { withAdmin } from '../../../../../lib/auth';
import { withCSRFProtection } from '../../../../../lib/csrf';
import { withRateLimit } from '../../../../../lib/rateLimit';
import { logAdminAction, AUDIT_CATEGORIES } from '../../../../../lib/auditLog';

async function handler(req, res) {
  // Set proper headers
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDb();

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

    // Audit log the action
    await logAdminAction(req, 'user_update', AUDIT_CATEGORIES.USER_MANAGEMENT, {
      targetUserId: id,
      previousPoints: currentPoints,
      addedPoints: points,
      newTotal: newTotal,
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

// Apply admin auth, rate limiting, then CSRF protection
export default withAdmin(withRateLimit(withCSRFProtection(handler), 'admin'));

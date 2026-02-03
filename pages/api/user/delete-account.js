/**
 * Account Deletion API (GDPR Right to Erasure / CCPA Delete)
 * Allows users to delete their account and all associated data
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { deleteUserData } from '../../../lib/compliance';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const userId = session.user.id;
    const { confirmation } = req.body;
    
    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Please provide confirmation: "DELETE_MY_ACCOUNT"',
      });
    }
    
    // Delete user data
    const deletionSummary = await deleteUserData(userId, userId, {
      preserveAuditLogs: true,
      softDelete: false,
    });
    
    return res.status(200).json({
      success: true,
      message: 'Your account has been deleted',
      summary: deletionSummary,
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}

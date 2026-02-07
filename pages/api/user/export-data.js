/**
 * User Data Export API (GDPR Right to Access)
 * Allows users to export all their personal data
 */

import { withAuth } from '../../../lib/auth';
import { exportUserData } from '../../../lib/compliance';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const userId = req.user.uid || req.user.id;
    
    // Export user data
    const userData = await exportUserData(userId, userId);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="user-data-export-${new Date().toISOString().split('T')[0]}.json"`
    );
    
    return res.status(200).json(userData);
  } catch (error) {
    console.error('Error exporting user data:', error);
    return res.status(500).json({ error: 'Failed to export data' });
  }
}

export default withAuth(handler);

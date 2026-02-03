/**
 * User Data Export API (GDPR Right to Access)
 * Allows users to export all their personal data
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { exportUserData } from '../../../lib/compliance';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const userId = session.user.id;
    
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

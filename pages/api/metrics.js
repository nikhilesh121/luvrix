/**
 * Metrics API Endpoint
 * Sprint 6 - Observability
 * 
 * Provides application metrics for monitoring dashboards
 * Protected endpoint - requires admin authentication
 */

import { getMetrics, checkAlerts } from '../../lib/monitoring';
import { verifyToken } from '../../lib/auth';
import { getDb } from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: decoded.uid });
    
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get metrics and alerts
    const metrics = getMetrics();
    const alerts = checkAlerts();

    // Add cache control
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    
    return res.status(200).json({
      ...metrics,
      alerts,
      alertCount: alerts.length,
      criticalAlerts: alerts.filter(a => a.level === 'critical').length,
    });
  } catch (error) {
    console.error('Metrics API error:', error);
    return res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
}

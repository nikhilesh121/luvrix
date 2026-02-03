/**
 * Admin Dashboard Metrics API
 * Returns SLA metrics and dashboard data for visualization
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getDashboardData, getPrometheusMetrics, calculateSLAMetrics } from '../../../lib/advancedMonitoring';

export default async function handler(req, res) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Check admin role
  if (session.user.role !== 'admin' && session.user.role !== 'editor') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  if (req.method === 'GET') {
    const { format } = req.query;
    
    try {
      // Prometheus format for Grafana
      if (format === 'prometheus') {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send(getPrometheusMetrics());
      }
      
      // SLA metrics only
      if (format === 'sla') {
        return res.status(200).json(calculateSLAMetrics());
      }
      
      // Full dashboard data (default)
      return res.status(200).json(getDashboardData());
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

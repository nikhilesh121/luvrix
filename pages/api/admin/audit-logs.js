/**
 * Admin Audit Logs API
 * View and query audit logs for compliance and security monitoring
 */

import { authOptions } from '../auth/[...nextauth]';
import { queryAuditLogs, getAuditStats } from '../../../lib/auditLog';

export default async function handler(req, res) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Check admin role
  if (session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  if (req.method === 'GET') {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        action,
        category,
        severity,
        startDate,
        endDate,
        stats,
      } = req.query;
      
      // If stats requested, return statistics
      if (stats === 'true') {
        const statistics = await getAuditStats({
          startDate,
          endDate,
        });
        return res.status(200).json(statistics);
      }
      
      // Query audit logs
      const filters = {};
      if (userId) filters.userId = userId;
      if (action) filters.action = action;
      if (category) filters.category = category;
      if (severity) filters.severity = severity;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const logs = await queryAuditLogs(filters, {
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
      });
      
      return res.status(200).json({
        logs,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: logs.length === parseInt(limit),
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

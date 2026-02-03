/**
 * Health Check API Endpoint
 * Sprint 6 - Observability
 * 
 * Provides health status for monitoring systems
 */

import { getHealthStatus } from '../../lib/monitoring';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = getHealthStatus();
    
    // Set appropriate status code based on health
    const statusCode = health.status === 'healthy' ? 200 
      : health.status === 'degraded' ? 200 
      : 503;

    // Add cache control to prevent caching health checks
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    
    return res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
}

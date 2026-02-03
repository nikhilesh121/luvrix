/**
 * Enterprise Monitoring & Observability Module
 * Sprint 6 - Observability Dashboards
 * 
 * Provides metrics collection, health checks, and alerting integration
 */

import logger from './logger';

// Metrics storage (in production, use Prometheus/Datadog)
const metrics = {
  requests: { total: 0, success: 0, error: 0 },
  responseTime: { sum: 0, count: 0, max: 0, min: Infinity },
  endpoints: {},
  errors: {},
};

/**
 * Record a request metric
 */
export function recordRequest(path, method, statusCode, duration) {
  metrics.requests.total++;
  
  if (statusCode >= 200 && statusCode < 400) {
    metrics.requests.success++;
  } else {
    metrics.requests.error++;
  }

  // Response time tracking
  metrics.responseTime.sum += duration;
  metrics.responseTime.count++;
  metrics.responseTime.max = Math.max(metrics.responseTime.max, duration);
  metrics.responseTime.min = Math.min(metrics.responseTime.min, duration);

  // Per-endpoint tracking
  const endpoint = `${method} ${path}`;
  if (!metrics.endpoints[endpoint]) {
    metrics.endpoints[endpoint] = { count: 0, errors: 0, totalTime: 0 };
  }
  metrics.endpoints[endpoint].count++;
  metrics.endpoints[endpoint].totalTime += duration;
  if (statusCode >= 400) {
    metrics.endpoints[endpoint].errors++;
  }
}

/**
 * Record an error
 */
export function recordError(errorType, message, context = {}) {
  if (!metrics.errors[errorType]) {
    metrics.errors[errorType] = { count: 0, lastSeen: null, samples: [] };
  }
  metrics.errors[errorType].count++;
  metrics.errors[errorType].lastSeen = new Date().toISOString();
  
  // Keep last 10 samples
  if (metrics.errors[errorType].samples.length < 10) {
    metrics.errors[errorType].samples.push({ message, context, timestamp: new Date().toISOString() });
  }

  // Log the error
  logger.error(`${errorType}: ${message}`, context);
}

/**
 * Get current metrics
 */
export function getMetrics() {
  const avgResponseTime = metrics.responseTime.count > 0 
    ? metrics.responseTime.sum / metrics.responseTime.count 
    : 0;

  return {
    timestamp: new Date().toISOString(),
    requests: {
      ...metrics.requests,
      errorRate: metrics.requests.total > 0 
        ? (metrics.requests.error / metrics.requests.total * 100).toFixed(2) + '%'
        : '0%',
    },
    responseTime: {
      avg: Math.round(avgResponseTime),
      max: metrics.responseTime.max === 0 ? 0 : metrics.responseTime.max,
      min: metrics.responseTime.min === Infinity ? 0 : metrics.responseTime.min,
    },
    topEndpoints: Object.entries(metrics.endpoints)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([endpoint, data]) => ({
        endpoint,
        requests: data.count,
        errors: data.errors,
        avgTime: Math.round(data.totalTime / data.count),
      })),
    errors: Object.entries(metrics.errors)
      .map(([type, data]) => ({
        type,
        count: data.count,
        lastSeen: data.lastSeen,
      })),
  };
}

/**
 * Health check response
 */
export function getHealthStatus() {
  const errorRate = metrics.requests.total > 0 
    ? metrics.requests.error / metrics.requests.total 
    : 0;

  const avgResponseTime = metrics.responseTime.count > 0 
    ? metrics.responseTime.sum / metrics.responseTime.count 
    : 0;

  // Determine health status
  let status = 'healthy';
  const issues = [];

  if (errorRate > 0.05) {
    status = 'degraded';
    issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
  }

  if (avgResponseTime > 1000) {
    status = 'degraded';
    issues.push(`Slow response time: ${Math.round(avgResponseTime)}ms`);
  }

  if (errorRate > 0.20) {
    status = 'unhealthy';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    issues,
    metrics: {
      requestsTotal: metrics.requests.total,
      errorRate: (errorRate * 100).toFixed(2) + '%',
      avgResponseTime: Math.round(avgResponseTime) + 'ms',
    },
  };
}

/**
 * Reset metrics (for testing)
 */
export function resetMetrics() {
  metrics.requests = { total: 0, success: 0, error: 0 };
  metrics.responseTime = { sum: 0, count: 0, max: 0, min: Infinity };
  metrics.endpoints = {};
  metrics.errors = {};
}

/**
 * Alert thresholds configuration
 */
export const alertThresholds = {
  errorRate: {
    warning: 0.01,  // 1%
    critical: 0.05, // 5%
  },
  responseTime: {
    warning: 500,   // 500ms
    critical: 2000, // 2s
  },
  requestsPerMinute: {
    warning: 1000,
    critical: 5000,
  },
};

/**
 * Check if alerts should be triggered
 */
export function checkAlerts() {
  const alerts = [];
  const errorRate = metrics.requests.total > 0 
    ? metrics.requests.error / metrics.requests.total 
    : 0;

  const avgResponseTime = metrics.responseTime.count > 0 
    ? metrics.responseTime.sum / metrics.responseTime.count 
    : 0;

  // Error rate alerts
  if (errorRate >= alertThresholds.errorRate.critical) {
    alerts.push({
      level: 'critical',
      type: 'error_rate',
      message: `Critical error rate: ${(errorRate * 100).toFixed(2)}%`,
      value: errorRate,
      threshold: alertThresholds.errorRate.critical,
    });
  } else if (errorRate >= alertThresholds.errorRate.warning) {
    alerts.push({
      level: 'warning',
      type: 'error_rate',
      message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
      value: errorRate,
      threshold: alertThresholds.errorRate.warning,
    });
  }

  // Response time alerts
  if (avgResponseTime >= alertThresholds.responseTime.critical) {
    alerts.push({
      level: 'critical',
      type: 'response_time',
      message: `Critical response time: ${Math.round(avgResponseTime)}ms`,
      value: avgResponseTime,
      threshold: alertThresholds.responseTime.critical,
    });
  } else if (avgResponseTime >= alertThresholds.responseTime.warning) {
    alerts.push({
      level: 'warning',
      type: 'response_time',
      message: `Slow response time: ${Math.round(avgResponseTime)}ms`,
      value: avgResponseTime,
      threshold: alertThresholds.responseTime.warning,
    });
  }

  return alerts;
}

/**
 * Middleware for automatic request monitoring
 */
export function withMonitoring(handler) {
  return async (req, res) => {
    const startTime = Date.now();
    const path = req.url?.split('?')[0] || '/';
    const method = req.method || 'GET';

    try {
      const result = await handler(req, res);
      const duration = Date.now() - startTime;
      recordRequest(path, method, res.statusCode, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      recordRequest(path, method, 500, duration);
      recordError('UnhandledException', error.message, { path, method });
      throw error;
    }
  };
}

export default {
  recordRequest,
  recordError,
  getMetrics,
  getHealthStatus,
  resetMetrics,
  checkAlerts,
  withMonitoring,
  alertThresholds,
};

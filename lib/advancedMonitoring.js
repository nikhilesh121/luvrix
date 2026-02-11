/**
 * Advanced Monitoring Dashboards
 * SLA alerting, metrics visualization, and performance baselines
 * 
 * @module lib/advancedMonitoring
 */

// SLA Thresholds Configuration
export const SLA_THRESHOLDS = {
  availability: {
    target: 99.9, // 99.9% uptime
    warning: 99.5,
    critical: 99.0,
  },
  responseTime: {
    p50: { target: 100, warning: 200, critical: 500 }, // ms
    p95: { target: 500, warning: 1000, critical: 2000 },
    p99: { target: 1000, warning: 2000, critical: 5000 },
  },
  errorRate: {
    target: 0.1, // 0.1%
    warning: 1.0,
    critical: 5.0,
  },
  throughput: {
    minRps: 100, // requests per second
    warningRps: 50,
  },
};

// Alert severities
export const ALERT_SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
  RESOLVED: "resolved",
};

// Alert types
export const ALERT_TYPES = {
  SLA_BREACH: "sla_breach",
  HIGH_ERROR_RATE: "high_error_rate",
  SLOW_RESPONSE: "slow_response",
  LOW_AVAILABILITY: "low_availability",
  HIGH_MEMORY: "high_memory",
  HIGH_CPU: "high_cpu",
  DATABASE_SLOW: "database_slow",
  CACHE_MISS_HIGH: "cache_miss_high",
};

// In-memory metrics store (use Redis in production)
let metricsBuffer = [];
let alerts = [];

/**
 * Record a metric
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {Object} tags - Metric tags
 */
export function recordMetric(name, value, tags = {}) {
  const metric = {
    name,
    value,
    tags,
    timestamp: Date.now(),
  };
  
  metricsBuffer.push(metric);
  
  // Keep buffer size manageable
  if (metricsBuffer.length > 10000) {
    metricsBuffer = metricsBuffer.slice(-5000);
  }
  
  // Check for alert conditions
  checkAlertConditions(metric);
}

/**
 * Check if metric triggers an alert
 * @param {Object} metric - Metric to check
 */
function checkAlertConditions(metric) {
  const { name, value } = metric;
  
  // Response time alerts
  if (name === "response_time") {
    if (value > SLA_THRESHOLDS.responseTime.p95.critical) {
      triggerAlert(ALERT_TYPES.SLOW_RESPONSE, ALERT_SEVERITY.CRITICAL, {
        message: `Response time ${value}ms exceeds critical threshold`,
        value,
        threshold: SLA_THRESHOLDS.responseTime.p95.critical,
      });
    } else if (value > SLA_THRESHOLDS.responseTime.p95.warning) {
      triggerAlert(ALERT_TYPES.SLOW_RESPONSE, ALERT_SEVERITY.WARNING, {
        message: `Response time ${value}ms exceeds warning threshold`,
        value,
        threshold: SLA_THRESHOLDS.responseTime.p95.warning,
      });
    }
  }
  
  // Error rate alerts
  if (name === "error_rate") {
    if (value > SLA_THRESHOLDS.errorRate.critical) {
      triggerAlert(ALERT_TYPES.HIGH_ERROR_RATE, ALERT_SEVERITY.CRITICAL, {
        message: `Error rate ${value}% exceeds critical threshold`,
        value,
        threshold: SLA_THRESHOLDS.errorRate.critical,
      });
    } else if (value > SLA_THRESHOLDS.errorRate.warning) {
      triggerAlert(ALERT_TYPES.HIGH_ERROR_RATE, ALERT_SEVERITY.WARNING, {
        message: `Error rate ${value}% exceeds warning threshold`,
        value,
        threshold: SLA_THRESHOLDS.errorRate.warning,
      });
    }
  }
  
  // Memory alerts
  if (name === "memory_usage_percent") {
    if (value > 90) {
      triggerAlert(ALERT_TYPES.HIGH_MEMORY, ALERT_SEVERITY.CRITICAL, {
        message: `Memory usage ${value}% is critical`,
        value,
      });
    } else if (value > 80) {
      triggerAlert(ALERT_TYPES.HIGH_MEMORY, ALERT_SEVERITY.WARNING, {
        message: `Memory usage ${value}% is high`,
        value,
      });
    }
  }
}

/**
 * Trigger an alert
 * @param {string} type - Alert type
 * @param {string} severity - Alert severity
 * @param {Object} details - Alert details
 */
export function triggerAlert(type, severity, details) {
  const alert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    severity,
    details,
    timestamp: new Date().toISOString(),
    acknowledged: false,
  };
  
  alerts.push(alert);
  
  // Keep alerts buffer manageable
  if (alerts.length > 1000) {
    alerts = alerts.slice(-500);
  }
  
  // In production, send to PagerDuty/Slack
  console.log(`[ALERT] ${severity.toUpperCase()}: ${type} - ${details.message}`);
  
  return alert;
}

/**
 * Get active alerts
 * @param {Object} filters - Filters
 * @returns {Array} Active alerts
 */
export function getActiveAlerts(filters = {}) {
  let result = alerts.filter(a => !a.acknowledged);
  
  if (filters.severity) {
    result = result.filter(a => a.severity === filters.severity);
  }
  if (filters.type) {
    result = result.filter(a => a.type === filters.type);
  }
  
  return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Acknowledge an alert
 * @param {string} alertId - Alert ID
 * @param {string} acknowledgedBy - Who acknowledged
 */
export function acknowledgeAlert(alertId, acknowledgedBy) {
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();
  }
  return alert;
}

/**
 * Calculate SLA metrics
 * @param {number} timeWindowMs - Time window in milliseconds
 * @returns {Object} SLA metrics
 */
export function calculateSLAMetrics(timeWindowMs = 3600000) {
  const cutoff = Date.now() - timeWindowMs;
  const recentMetrics = metricsBuffer.filter(m => m.timestamp > cutoff);
  
  // Calculate response times
  const responseTimes = recentMetrics
    .filter(m => m.name === "response_time")
    .map(m => m.value)
    .sort((a, b) => a - b);
  
  const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)] || 0;
  const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
  const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;
  
  // Calculate error rate
  const totalRequests = recentMetrics.filter(m => m.name === "request_count").length;
  const errors = recentMetrics.filter(m => m.name === "error_count").length;
  const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;
  
  // Calculate availability
  const healthChecks = recentMetrics.filter(m => m.name === "health_check");
  const successfulChecks = healthChecks.filter(m => m.value === 1).length;
  const availability = healthChecks.length > 0 
    ? (successfulChecks / healthChecks.length) * 100 
    : 100;
  
  return {
    responseTime: { p50, p95, p99 },
    errorRate,
    availability,
    totalRequests,
    timeWindow: timeWindowMs,
    calculatedAt: new Date().toISOString(),
    slaStatus: {
      responseTime: p95 <= SLA_THRESHOLDS.responseTime.p95.target ? "OK" : "BREACH",
      errorRate: errorRate <= SLA_THRESHOLDS.errorRate.target ? "OK" : "BREACH",
      availability: availability >= SLA_THRESHOLDS.availability.target ? "OK" : "BREACH",
    },
  };
}

/**
 * Get Grafana-compatible metrics format
 * @returns {Object} Prometheus/Grafana format metrics
 */
export function getPrometheusMetrics() {
  const sla = calculateSLAMetrics();
  const activeAlerts = getActiveAlerts();
  
  const lines = [
    "# HELP luvrix_response_time_p95 95th percentile response time in ms",
    "# TYPE luvrix_response_time_p95 gauge",
    `luvrix_response_time_p95 ${sla.responseTime.p95}`,
    "",
    "# HELP luvrix_error_rate Current error rate percentage",
    "# TYPE luvrix_error_rate gauge",
    `luvrix_error_rate ${sla.errorRate}`,
    "",
    "# HELP luvrix_availability Current availability percentage",
    "# TYPE luvrix_availability gauge",
    `luvrix_availability ${sla.availability}`,
    "",
    "# HELP luvrix_active_alerts Number of active alerts",
    "# TYPE luvrix_active_alerts gauge",
    `luvrix_active_alerts ${activeAlerts.length}`,
    "",
    "# HELP luvrix_critical_alerts Number of critical alerts",
    "# TYPE luvrix_critical_alerts gauge",
    `luvrix_critical_alerts ${activeAlerts.filter(a => a.severity === "critical").length}`,
  ];
  
  return lines.join("\n");
}

/**
 * Get dashboard data for visualization
 * @returns {Object} Dashboard data
 */
export function getDashboardData() {
  const sla = calculateSLAMetrics();
  const activeAlerts = getActiveAlerts();
  
  return {
    sla,
    alerts: {
      active: activeAlerts.length,
      critical: activeAlerts.filter(a => a.severity === "critical").length,
      warning: activeAlerts.filter(a => a.severity === "warning").length,
      recent: activeAlerts.slice(0, 10),
    },
    thresholds: SLA_THRESHOLDS,
    status: {
      overall: activeAlerts.some(a => a.severity === "critical") ? "CRITICAL"
        : activeAlerts.some(a => a.severity === "warning") ? "WARNING"
        : "HEALTHY",
    },
    updatedAt: new Date().toISOString(),
  };
}

export default {
  SLA_THRESHOLDS,
  ALERT_SEVERITY,
  ALERT_TYPES,
  recordMetric,
  triggerAlert,
  getActiveAlerts,
  acknowledgeAlert,
  calculateSLAMetrics,
  getPrometheusMetrics,
  getDashboardData,
};

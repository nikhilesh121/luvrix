/**
 * Audit Logging System for SOC2 Compliance
 * Logs all admin actions with timestamps, user info, and action details
 * 
 * @module lib/auditLog
 */

import { getDb } from './mongodb';

// Audit log categories
export const AUDIT_CATEGORIES = {
  USER_MANAGEMENT: 'user_management',
  CONTENT_MANAGEMENT: 'content_management',
  SYSTEM_CONFIG: 'system_config',
  SECURITY: 'security',
  DATA_ACCESS: 'data_access',
  AUTHENTICATION: 'authentication',
};

// Audit log actions
export const AUDIT_ACTIONS = {
  // User management
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_ROLE_CHANGE: 'user_role_change',
  USER_SUSPEND: 'user_suspend',
  USER_ACTIVATE: 'user_activate',
  
  // Content management
  CONTENT_CREATE: 'content_create',
  CONTENT_UPDATE: 'content_update',
  CONTENT_DELETE: 'content_delete',
  CONTENT_PUBLISH: 'content_publish',
  CONTENT_UNPUBLISH: 'content_unpublish',
  
  // System configuration
  CONFIG_UPDATE: 'config_update',
  SETTINGS_CHANGE: 'settings_change',
  
  // Security
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  MFA_ENABLE: 'mfa_enable',
  MFA_DISABLE: 'mfa_disable',
  
  // Data access
  DATA_EXPORT: 'data_export',
  DATA_DELETE: 'data_delete',
  BULK_OPERATION: 'bulk_operation',
};

// Severity levels
export const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - ID of user performing action
 * @param {string} params.userEmail - Email of user performing action
 * @param {string} params.userRole - Role of user performing action
 * @param {string} params.action - Action being performed (from AUDIT_ACTIONS)
 * @param {string} params.category - Category of action (from AUDIT_CATEGORIES)
 * @param {string} params.resourceType - Type of resource being acted upon
 * @param {string} params.resourceId - ID of resource being acted upon
 * @param {Object} params.details - Additional details about the action
 * @param {string} params.severity - Severity level (from SEVERITY)
 * @param {string} params.ipAddress - IP address of request
 * @param {string} params.userAgent - User agent string
 * @returns {Promise<Object>} Created audit log entry
 */
export async function createAuditLog({
  userId,
  userEmail,
  userRole,
  action,
  category,
  resourceType,
  resourceId,
  details = {},
  severity = SEVERITY.INFO,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    const db = await getDb();
    
    const auditEntry = {
      timestamp: new Date(),
      userId,
      userEmail,
      userRole,
      action,
      category,
      resourceType,
      resourceId,
      details,
      severity,
      ipAddress,
      userAgent,
      // Compliance metadata
      retentionDate: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
      version: '1.0',
    };
    
    const result = await db.collection('audit_logs').insertOne(auditEntry);
    
    return { ...auditEntry, _id: result.insertedId };
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the application
    return null;
  }
}

/**
 * Query audit logs with filters
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options (limit, skip, sort)
 * @returns {Promise<Array>} Audit log entries
 */
export async function queryAuditLogs(filters = {}, options = {}) {
  try {
    const db = await getDb();
    
    const {
      limit = 100,
      skip = 0,
      sort = { timestamp: -1 },
    } = options;
    
    const query = {};
    
    // Apply filters
    if (filters.userId) query.userId = filters.userId;
    if (filters.userEmail) query.userEmail = filters.userEmail;
    if (filters.action) query.action = filters.action;
    if (filters.category) query.category = filters.category;
    if (filters.resourceType) query.resourceType = filters.resourceType;
    if (filters.resourceId) query.resourceId = filters.resourceId;
    if (filters.severity) query.severity = filters.severity;
    
    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }
    
    const logs = await db.collection('audit_logs')
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return logs;
  } catch (error) {
    console.error('Failed to query audit logs:', error);
    throw error;
  }
}

/**
 * Get audit log statistics
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} Statistics
 */
export async function getAuditStats(filters = {}) {
  try {
    const db = await getDb();
    
    const query = {};
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }
    
    const stats = await db.collection('audit_logs').aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byCategory: {
            $push: '$category',
          },
          bySeverity: {
            $push: '$severity',
          },
        },
      },
    ]).toArray();
    
    if (stats.length === 0) {
      return { total: 0, byCategory: {}, bySeverity: {} };
    }
    
    // Count occurrences
    const countOccurrences = (arr) => arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: stats[0].total,
      byCategory: countOccurrences(stats[0].byCategory),
      bySeverity: countOccurrences(stats[0].bySeverity),
    };
  } catch (error) {
    console.error('Failed to get audit stats:', error);
    throw error;
  }
}

/**
 * Middleware to automatically log admin actions
 * @param {Object} req - Request object
 * @param {string} action - Action being performed
 * @param {string} category - Category of action
 * @param {Object} details - Additional details
 */
export async function logAdminAction(req, action, category, details = {}) {
  const user = req.user || {};
  
  await createAuditLog({
    userId: user.uid || user.id || 'unknown',
    userEmail: user.email || 'unknown',
    userRole: user.role || 'unknown',
    action,
    category,
    resourceType: details.resourceType || 'unknown',
    resourceId: details.resourceId || 'unknown',
    details,
    severity: details.severity || SEVERITY.INFO,
    ipAddress: req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress,
    userAgent: req.headers?.['user-agent'],
  });
}

export default {
  createAuditLog,
  queryAuditLogs,
  getAuditStats,
  logAdminAction,
  AUDIT_CATEGORIES,
  AUDIT_ACTIONS,
  SEVERITY,
};

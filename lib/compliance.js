/**
 * Compliance Automation Module
 * GDPR/CCPA compliant data export and deletion workflows
 * 
 * @module lib/compliance
 */

import { getDb } from "./mongodb";
import { createAuditLog, AUDIT_ACTIONS, AUDIT_CATEGORIES, SEVERITY } from "./auditLog";

/**
 * Export all user data (GDPR Right to Access)
 * @param {string} userId - User ID
 * @param {string} requestedBy - Who requested the export
 * @returns {Promise<Object>} User data export
 */
export async function exportUserData(userId, requestedBy) {
  try {
    const db = await getDb();
    
    // Collect user data from all collections
    const userData = {
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
      userId,
      requestedBy,
      data: {},
    };
    
    // User profile
    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { password: 0 } } // Exclude password
    );
    userData.data.profile = user;
    
    // User preferences
    const preferences = await db.collection("user_preferences").findOne({ userId });
    userData.data.preferences = preferences;
    
    // User content (blogs, comments)
    const blogs = await db.collection("blogs").find({ authorId: userId }).toArray();
    userData.data.blogs = blogs;
    
    const comments = await db.collection("comments").find({ userId }).toArray();
    userData.data.comments = comments;
    
    // Reading history
    const readingHistory = await db.collection("reading_history").find({ userId }).toArray();
    userData.data.readingHistory = readingHistory;
    
    // Bookmarks/Favorites
    const bookmarks = await db.collection("bookmarks").find({ userId }).toArray();
    userData.data.bookmarks = bookmarks;
    
    // Login history (last 90 days)
    const loginHistory = await db.collection("login_history")
      .find({ 
        userId,
        timestamp: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      })
      .toArray();
    userData.data.loginHistory = loginHistory;
    
    // Consent records
    const consents = await db.collection("consents").find({ userId }).toArray();
    userData.data.consents = consents;
    
    // Log the export
    await createAuditLog({
      userId: requestedBy,
      userEmail: "system",
      userRole: "system",
      action: AUDIT_ACTIONS.DATA_EXPORT,
      category: AUDIT_CATEGORIES.DATA_ACCESS,
      resourceType: "user_data",
      resourceId: userId,
      details: {
        collections: Object.keys(userData.data),
        recordCount: Object.values(userData.data).reduce((sum, arr) => 
          sum + (Array.isArray(arr) ? arr.length : 1), 0
        ),
      },
      severity: SEVERITY.INFO,
    });
    
    return userData;
  } catch (error) {
    console.error("Error exporting user data:", error);
    throw error;
  }
}

/**
 * Delete all user data (GDPR Right to Erasure / CCPA Delete)
 * @param {string} userId - User ID
 * @param {string} requestedBy - Who requested the deletion
 * @param {Object} options - Deletion options
 * @returns {Promise<Object>} Deletion summary
 */
export async function deleteUserData(userId, requestedBy, options = {}) {
  try {
    const db = await getDb();
    
    const { preserveAuditLogs = true, softDelete = false } = options;
    
    const deletionSummary = {
      deletionDate: new Date().toISOString(),
      userId,
      requestedBy,
      deletedCollections: {},
      preserved: [],
    };
    
    if (softDelete) {
      // Soft delete - anonymize data instead of removing
      const anonymizedData = {
        email: `deleted_${userId}@anonymized.local`,
        name: "Deleted User",
        deletedAt: new Date(),
        deletedBy: requestedBy,
      };
      
      await db.collection("users").updateOne(
        { _id: userId },
        { $set: anonymizedData }
      );
      deletionSummary.deletedCollections.users = { action: "anonymized", count: 1 };
    } else {
      // Hard delete
      const userResult = await db.collection("users").deleteOne({ _id: userId });
      deletionSummary.deletedCollections.users = { action: "deleted", count: userResult.deletedCount };
    }
    
    // Delete user preferences
    const prefResult = await db.collection("user_preferences").deleteMany({ userId });
    deletionSummary.deletedCollections.preferences = { count: prefResult.deletedCount };
    
    // Anonymize user content (preserve content, remove attribution)
    const blogResult = await db.collection("blogs").updateMany(
      { authorId: userId },
      { $set: { authorId: "deleted", authorName: "Deleted User" } }
    );
    deletionSummary.deletedCollections.blogs = { action: "anonymized", count: blogResult.modifiedCount };
    
    // Delete comments
    const commentResult = await db.collection("comments").deleteMany({ userId });
    deletionSummary.deletedCollections.comments = { count: commentResult.deletedCount };
    
    // Delete reading history
    const historyResult = await db.collection("reading_history").deleteMany({ userId });
    deletionSummary.deletedCollections.readingHistory = { count: historyResult.deletedCount };
    
    // Delete bookmarks
    const bookmarkResult = await db.collection("bookmarks").deleteMany({ userId });
    deletionSummary.deletedCollections.bookmarks = { count: bookmarkResult.deletedCount };
    
    // Delete login history
    const loginResult = await db.collection("login_history").deleteMany({ userId });
    deletionSummary.deletedCollections.loginHistory = { count: loginResult.deletedCount };
    
    // Preserve audit logs for compliance (mark as belonging to deleted user)
    if (preserveAuditLogs) {
      await db.collection("audit_logs").updateMany(
        { userId },
        { $set: { userDeleted: true, userEmail: "deleted" } }
      );
      deletionSummary.preserved.push("audit_logs");
    }
    
    // Log the deletion
    await createAuditLog({
      userId: requestedBy,
      userEmail: "system",
      userRole: "system",
      action: AUDIT_ACTIONS.DATA_DELETE,
      category: AUDIT_CATEGORIES.DATA_ACCESS,
      resourceType: "user_data",
      resourceId: userId,
      details: deletionSummary,
      severity: SEVERITY.WARNING,
    });
    
    return deletionSummary;
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw error;
  }
}

/**
 * Record user consent
 * @param {string} userId - User ID
 * @param {string} consentType - Type of consent
 * @param {boolean} granted - Whether consent was granted
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Consent record
 */
export async function recordConsent(userId, consentType, granted, metadata = {}) {
  try {
    const db = await getDb();
    
    const consentRecord = {
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      version: metadata.version || "1.0",
    };
    
    await db.collection("consents").insertOne(consentRecord);
    
    return consentRecord;
  } catch (error) {
    console.error("Error recording consent:", error);
    throw error;
  }
}

/**
 * Get user consent status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Consent status for all types
 */
export async function getConsentStatus(userId) {
  try {
    const db = await getDb();
    
    // Get latest consent for each type
    const consents = await db.collection("consents").aggregate([
      { $match: { userId } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$consentType",
          latestConsent: { $first: "$$ROOT" },
        },
      },
    ]).toArray();
    
    const status = {};
    consents.forEach(c => {
      status[c._id] = {
        granted: c.latestConsent.granted,
        timestamp: c.latestConsent.timestamp,
      };
    });
    
    return status;
  } catch (error) {
    console.error("Error getting consent status:", error);
    throw error;
  }
}

/**
 * Data retention policy enforcement
 * @param {Object} policies - Retention policies by collection
 * @returns {Promise<Object>} Cleanup summary
 */
export async function enforceRetentionPolicies(policies = {}) {
  try {
    const db = await getDb();
    
    const defaultPolicies = {
      login_history: 90, // 90 days
      reading_history: 365, // 1 year
      session_logs: 30, // 30 days
      ...policies,
    };
    
    const summary = {
      executedAt: new Date(),
      deleted: {},
    };
    
    for (const [collection, retentionDays] of Object.entries(defaultPolicies)) {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      try {
        const result = await db.collection(collection).deleteMany({
          timestamp: { $lt: cutoffDate },
        });
        summary.deleted[collection] = result.deletedCount;
      } catch (err) {
        summary.deleted[collection] = { error: err.message };
      }
    }
    
    // Log retention enforcement
    await createAuditLog({
      userId: "system",
      userEmail: "system",
      userRole: "system",
      action: AUDIT_ACTIONS.BULK_OPERATION,
      category: AUDIT_CATEGORIES.SYSTEM_CONFIG,
      resourceType: "retention_policy",
      resourceId: "all",
      details: summary,
      severity: SEVERITY.INFO,
    });
    
    return summary;
  } catch (error) {
    console.error("Error enforcing retention policies:", error);
    throw error;
  }
}

export default {
  exportUserData,
  deleteUserData,
  recordConsent,
  getConsentStatus,
  enforceRetentionPolicies,
};

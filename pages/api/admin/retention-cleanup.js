/**
 * Data Retention Cleanup API (Cron-safe)
 * Enforces data retention policies for GDPR/SOC2 compliance
 * Can be triggered by: node-cron, Vercel Cron, or manual admin call
 * 
 * Cleans up:
 * - Expired error logs (>30 days)
 * - Old pageview data (>90 days, aggregated)
 * - Expired password reset tokens
 * - Old watch time raw data (>90 days)
 * - Expired consent records (>7 years for audit, but anonymize IP after 1 year)
 */

import { withAdmin } from "../../../lib/auth";
import { getDb } from "../../../lib/mongodb";
import { logAdminAction, AUDIT_CATEGORIES } from "../../../lib/auditLog";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = await getDb();
    const now = new Date();
    const results = {};

    // 1. Clean expired error logs (>30 days)
    const errorLogCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const errorLogResult = await db.collection("error_logs").deleteMany({
      serverTimestamp: { $lt: errorLogCutoff },
    });
    results.errorLogs = { deleted: errorLogResult.deletedCount, cutoff: "30 days" };

    // 2. Clean old raw pageview data (>90 days)
    const pageviewCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const pageviewResult = await db.collection("pageviews").deleteMany({
      timestamp: { $lt: pageviewCutoff },
    });
    results.pageviews = { deleted: pageviewResult.deletedCount, cutoff: "90 days" };

    // 3. Clean expired password reset tokens
    const resetResult = await db.collection("passwordResets").deleteMany({
      expiresAt: { $lt: now },
    });
    results.passwordResets = { deleted: resetResult.deletedCount };

    // 4. Clean old watch time raw data (>90 days)
    const watchtimeCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const watchtimeResult = await db.collection("watchtime").deleteMany({
      createdAt: { $lt: watchtimeCutoff },
    });
    results.watchtime = { deleted: watchtimeResult.deletedCount, cutoff: "90 days" };

    // 5. Anonymize old consent records IP (>1 year, keep record for 7-year audit)
    const consentAnonymizeCutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const consentResult = await db.collection("consent_audit").updateMany(
      {
        timestamp: { $lt: consentAnonymizeCutoff },
        ip: { $ne: "anonymized" },
      },
      {
        $set: { ip: "anonymized", userAgent: "anonymized" },
      }
    );
    results.consentAnonymized = { updated: consentResult.modifiedCount, cutoff: "1 year" };

    // Audit log the cleanup
    await logAdminAction(req, "retention_cleanup", AUDIT_CATEGORIES.SYSTEM_CONFIG, {
      results,
      executedAt: now.toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "Retention cleanup completed",
      results,
      executedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Retention cleanup error:", error);
    return res.status(500).json({ error: "Retention cleanup failed" });
  }
}

export default withAdmin(handler);

/**
 * Full Health Check API
 * Returns comprehensive status of all subsystems: DB, Queue, Monitoring
 * Used by load balancers, uptime monitors, and ops dashboards
 */

import { getDb } from "../../../lib/mongodb";
import { getQueueStats } from "../../../lib/jobQueue";
import { getHealthStatus } from "../../../lib/monitoring";
import "../../../lib/shutdown"; // Auto-initializes graceful shutdown on first import

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const checks = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {},
  };

  // 1. Database check
  try {
    const db = await getDb();
    const start = Date.now();
    await db.command({ ping: 1 });
    const latency = Date.now() - start;
    checks.checks.database = {
      status: latency < 1000 ? "healthy" : "degraded",
      latencyMs: latency,
    };
  } catch (error) {
    checks.checks.database = { status: "unhealthy", error: error.message };
    checks.status = "unhealthy";
  }

  // 2. Job Queue check
  try {
    const stats = getQueueStats();
    const failedRatio = stats.total > 0 ? stats.failed / stats.total : 0;
    checks.checks.jobQueue = {
      status: failedRatio > 0.5 ? "degraded" : "healthy",
      pending: stats.pending || 0,
      processing: stats.processing || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0,
    };
  } catch (error) {
    checks.checks.jobQueue = { status: "unavailable", error: error.message };
  }

  // 3. Monitoring / Metrics check
  try {
    const health = getHealthStatus();
    checks.checks.monitoring = {
      status: health.status === "healthy" ? "healthy" : "degraded",
      errorRate: health.errorRate || 0,
      avgResponseTime: health.avgResponseTime || 0,
    };
  } catch (error) {
    checks.checks.monitoring = { status: "unavailable", error: error.message };
  }

  // 4. Memory check
  const heapUsedMB = checks.memory.heapUsed / 1024 / 1024;
  checks.checks.memory = {
    status: heapUsedMB > 512 ? "degraded" : "healthy",
    heapUsedMB: Math.round(heapUsedMB),
    rssUsedMB: Math.round(checks.memory.rss / 1024 / 1024),
  };

  // Determine overall status
  const statuses = Object.values(checks.checks).map((c) => c.status);
  if (statuses.includes("unhealthy")) {
    checks.status = "unhealthy";
  } else if (statuses.includes("degraded")) {
    checks.status = "degraded";
  }

  const statusCode = checks.status === "unhealthy" ? 503 : 200;
  res.setHeader("Cache-Control", "no-store");
  return res.status(statusCode).json(checks);
}

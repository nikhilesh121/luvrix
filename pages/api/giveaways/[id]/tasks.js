import { verifyToken } from "../../../../lib/auth";
import { getDb } from "../../../../lib/mongodb";
import { getGiveaway, addTask, updateTask, removeTask, getTasksForGiveaway } from "../../../../lib/giveaway";
import { createAuditLog, AUDIT_CATEGORIES, SEVERITY } from "../../../../lib/auditLog";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Resolve slug or id to actual giveaway
    const giveaway = await getGiveaway(id);
    if (!giveaway) return res.status(404).json({ error: "Giveaway not found" });
    const giveawayId = giveaway.id;

    if (req.method === "GET") {
      const tasks = await getTasksForGiveaway(giveawayId);
      return res.status(200).json(tasks);
    }

    // Admin only for POST/DELETE
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const db = await getDb();
    const user = await db.collection("users").findOne({ _id: decoded.uid });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (req.method === "POST") {
      const { title } = req.body;
      if (!title) return res.status(400).json({ error: "Task title is required" });

      const task = await addTask(giveawayId, req.body);

      await createAuditLog({
        userId: decoded.uid,
        userEmail: user.email,
        userRole: "ADMIN",
        action: "giveaway_task_add",
        category: AUDIT_CATEGORIES.CONTENT_MANAGEMENT,
        resourceType: "giveaway_task",
        resourceId: task.id,
        details: { giveawayId, taskTitle: title },
        severity: SEVERITY.INFO,
      });

      return res.status(201).json(task);
    }

    if (req.method === "PUT") {
      const { taskId, ...updates } = req.body;
      if (!taskId) return res.status(400).json({ error: "Task ID is required" });

      const updated = await updateTask(taskId, updates);

      await createAuditLog({
        userId: decoded.uid,
        userEmail: user.email,
        userRole: "ADMIN",
        action: "giveaway_task_edit",
        category: AUDIT_CATEGORIES.CONTENT_MANAGEMENT,
        resourceType: "giveaway_task",
        resourceId: taskId,
        details: { giveawayId, updates: Object.keys(updates) },
        severity: SEVERITY.INFO,
      });

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      const { taskId } = req.body;
      if (!taskId) return res.status(400).json({ error: "Task ID is required" });

      await removeTask(taskId);

      await createAuditLog({
        userId: decoded.uid,
        userEmail: user.email,
        userRole: "ADMIN",
        action: "giveaway_task_remove",
        category: AUDIT_CATEGORIES.CONTENT_MANAGEMENT,
        resourceType: "giveaway_task",
        resourceId: taskId,
        details: { giveawayId },
        severity: SEVERITY.INFO,
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Giveaway tasks API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

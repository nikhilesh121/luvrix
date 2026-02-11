import { verifyToken } from "../../../lib/auth";
import { getDb } from "../../../lib/mongodb";
import { createGiveaway, listGiveaways } from "../../../lib/giveaway";
import { createAuditLog, AUDIT_CATEGORIES, SEVERITY } from "../../../lib/auditLog";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // Public: list active giveaways; Admin: list all
      const token = req.headers.authorization?.replace("Bearer ", "");
      let isAdmin = false;

      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          const db = await getDb();
          const user = await db.collection("users").findOne({ _id: decoded.uid });
          if (user?.role === "ADMIN") isAdmin = true;
        }
      }

      const filter = {};
      if (isAdmin) {
        if (req.query.status) filter.status = req.query.status;
      } else {
        // Public: show active, ended, and winner_selected (not draft)
        filter.status = { $in: ["upcoming", "active", "ended", "winner_selected"] };
      }

      const giveaways = await listGiveaways(filter);

      // Auto-transition and auto-extend
      const now = new Date();
      const { ObjectId } = require("mongodb");
      const db2 = await getDb();
      for (const g of giveaways) {
        const objId = ObjectId.isValid(g.id) && g.id.length === 24 ? new ObjectId(g.id) : g.id;

        // upcoming → active
        if (g.status === "upcoming" && g.startDate && new Date(g.startDate) <= now) {
          try {
            await db2.collection("giveaways").updateOne({ _id: objId }, { $set: { status: "active", updatedAt: now } });
            g.status = "active";
          } catch (e) { console.error("Auto-transition error:", e); }
        }

        // Auto-extend: active giveaway past endDate
        if (g.status === "active" && g.endDate && g.startDate && new Date(g.endDate) <= now) {
          const maxExt = g.maxExtensions ?? 0;
          const usedExt = g.extensionsUsed || 0;
          if (maxExt === -1 || usedExt < maxExt) {
            try {
              const startDate = new Date(g.startDate);
              const endDate = new Date(g.endDate);
              const duration = endDate.getTime() - startDate.getTime();
              const newEndDate = new Date(endDate.getTime() + duration);
              await db2.collection("giveaways").updateOne({ _id: objId }, { $set: { endDate: newEndDate, updatedAt: now }, $inc: { extensionsUsed: 1 } });
              g.endDate = newEndDate.toISOString();
              g.extensionsUsed = usedExt + 1;
            } catch (e) { console.error("Auto-extend error:", e); }
          }
        }
      }

      return res.status(200).json(giveaways);
    }

    if (req.method === "POST") {
      // Admin only: create giveaway
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "Unauthorized" });

      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ error: "Invalid token" });

      const db = await getDb();
      const user = await db.collection("users").findOne({ _id: decoded.uid });
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { title, imageUrl } = req.body;
      if (!title || !imageUrl) {
        return res.status(400).json({ error: "Title and image are required" });
      }

      const giveaway = await createGiveaway({
        ...req.body,
        createdBy: decoded.uid,
      });

      await createAuditLog({
        userId: decoded.uid,
        userEmail: user.email,
        userRole: "ADMIN",
        action: "giveaway_create",
        category: AUDIT_CATEGORIES.CONTENT_MANAGEMENT,
        resourceType: "giveaway",
        resourceId: giveaway.id,
        details: { title: giveaway.title, slug: giveaway.slug },
        severity: SEVERITY.INFO,
      });

      return res.status(201).json(giveaway);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Giveaways API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

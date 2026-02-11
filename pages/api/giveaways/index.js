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

      // Auto-transition any upcoming giveaways whose startDate has passed
      const now = new Date();
      for (const g of giveaways) {
        if (g.status === "upcoming" && g.startDate && new Date(g.startDate) <= now) {
          try {
            const { ObjectId } = require("mongodb");
            await db.collection("giveaways").updateOne(
              { _id: ObjectId.isValid(g.id) && g.id.length === 24 ? new ObjectId(g.id) : g.id },
              { $set: { status: "active", updatedAt: now } }
            );
            g.status = "active";
          } catch (e) { console.error("Auto-transition error:", e); }
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

import { verifyToken } from "../../../lib/auth";
import { getDb } from "../../../lib/mongodb";
import { getGiveaway, updateGiveaway, deleteGiveaway } from "../../../lib/giveaway";
import { createAuditLog, AUDIT_CATEGORIES, SEVERITY } from "../../../lib/auditLog";
import { sendGiveawayLiveEmail } from "../../../utils/email";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === "GET") {
      let giveaway = await getGiveaway(id);
      if (!giveaway) return res.status(404).json({ error: "Giveaway not found" });

      // Auto-transition: upcoming → active when startDate has passed
      if (giveaway.status === "upcoming" && giveaway.startDate) {
        const now = new Date();
        const startDate = new Date(giveaway.startDate);
        if (now >= startDate) {
          try {
            const db = await getDb();
            await db.collection("giveaways").updateOne(
              { slug: giveaway.slug || undefined, _id: giveaway.id ? require("mongodb").ObjectId.createFromHexString(giveaway.id) : undefined },
              { $set: { status: "active", updatedAt: new Date() } }
            );
            giveaway.status = "active";

            // Send emails to interested users (fire-and-forget)
            const interests = await db.collection("giveaway_interests")
              .find({ giveawayId: giveaway.id })
              .project({ email: 1, name: 1 })
              .toArray();
            if (interests.length > 0 && typeof sendGiveawayLiveEmail === "function") {
              for (const interest of interests) {
                if (interest.email) {
                  sendGiveawayLiveEmail(interest.email, interest.name || "there", giveaway.title, giveaway.slug).catch(() => {});
                }
              }
            }
          } catch (transErr) {
            console.error("Auto-transition error:", transErr);
          }
        }
      }

      return res.status(200).json(giveaway);
    }

    // Admin-only methods
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const db = await getDb();
    const user = await db.collection("users").findOne({ _id: decoded.uid });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (req.method === "PUT") {
      const updated = await updateGiveaway(id, req.body);
      if (!updated) return res.status(404).json({ error: "Giveaway not found" });

      await createAuditLog({
        userId: decoded.uid,
        userEmail: user.email,
        userRole: "ADMIN",
        action: "giveaway_update",
        category: AUDIT_CATEGORIES.CONTENT_MANAGEMENT,
        resourceType: "giveaway",
        resourceId: id,
        details: { updatedFields: Object.keys(req.body) },
        severity: SEVERITY.INFO,
      });

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      await deleteGiveaway(id);

      await createAuditLog({
        userId: decoded.uid,
        userEmail: user.email,
        userRole: "ADMIN",
        action: "giveaway_delete",
        category: AUDIT_CATEGORIES.CONTENT_MANAGEMENT,
        resourceType: "giveaway",
        resourceId: id,
        details: {},
        severity: SEVERITY.WARNING,
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Giveaway API error:", error);
    return res.status(error.message?.includes("Cannot") ? 400 : 500).json({ error: error.message || "Internal server error" });
  }
}

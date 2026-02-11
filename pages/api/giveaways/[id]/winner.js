import { verifyToken } from "../../../../lib/auth";
import { getDb } from "../../../../lib/mongodb";
import { selectWinner, getGiveaway } from "../../../../lib/giveaway";
import { createAuditLog, AUDIT_CATEGORIES, SEVERITY } from "../../../../lib/auditLog";
import { sendGiveawayWinnerEmail } from "../../../../utils/email";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    // Admin only
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const db = await getDb();
    const user = await db.collection("users").findOne({ _id: decoded.uid });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { mode, winnerUserId } = req.body;
    if (!mode || !["SYSTEM_RANDOM", "ADMIN_RANDOM"].includes(mode)) {
      return res.status(400).json({ error: "Invalid selection mode. Must be SYSTEM_RANDOM or ADMIN_RANDOM" });
    }

    if (mode === "ADMIN_RANDOM" && !winnerUserId) {
      return res.status(400).json({ error: "Winner user ID required for admin selection" });
    }

    const result = await selectWinner(id, {
      mode,
      adminId: decoded.uid,
      winnerUserId,
    });

    // Audit log the winner selection
    await createAuditLog({
      userId: decoded.uid,
      userEmail: user.email,
      userRole: "ADMIN",
      action: "giveaway_winner_selected",
      category: AUDIT_CATEGORIES.CONTENT_MANAGEMENT,
      resourceType: "giveaway",
      resourceId: id,
      details: {
        winnerId: result.winnerId,
        selectionMode: mode,
        winnerUserId: mode === "ADMIN_RANDOM" ? winnerUserId : undefined,
      },
      severity: SEVERITY.CRITICAL,
    });

    // Send email notification to winner (non-blocking)
    const giveaway = await getGiveaway(id);
    const winnerUser = await db.collection("users").findOne({ _id: result.winnerId });
    if (winnerUser?.email && giveaway) {
      sendGiveawayWinnerEmail(
        winnerUser.email,
        winnerUser.name || "Winner",
        giveaway.title,
        giveaway.slug
      ).catch(err => console.error("Failed to send winner email:", err));
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Winner selection error:", error);
    const status = error.message?.includes("not found") ? 404
      : error.message?.includes("Cannot select") ? 403
      : error.message?.includes("already selected") ? 409
      : error.message?.includes("No eligible") ? 400 : 500;
    return res.status(status).json({ error: error.message || "Internal server error" });
  }
}

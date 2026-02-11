import { verifyToken } from "../../../../lib/auth";
import { getDb } from "../../../../lib/mongodb";
import { getGiveaway, listParticipants, getParticipantCount } from "../../../../lib/giveaway";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    // Resolve slug or id to actual giveaway
    const giveaway = await getGiveaway(id);
    if (!giveaway) return res.status(404).json({ error: "Giveaway not found" });
    const giveawayId = giveaway.id;

    // Check if requesting count only (public)
    if (req.query.countOnly === "true") {
      const count = await getParticipantCount(giveawayId);
      return res.status(200).json({ count });
    }

    // Full participant list is admin-only
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const db = await getDb();
    const user = await db.collection("users").findOne({ _id: decoded.uid });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.search = req.query.search;

    const participants = await listParticipants(giveawayId, filter);
    const total = await getParticipantCount(giveawayId);

    return res.status(200).json({ participants, total });
  } catch (error) {
    console.error("Participants API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

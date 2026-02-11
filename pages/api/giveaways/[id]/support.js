import { verifyToken } from "../../../../lib/auth";
import { getDb } from "../../../../lib/mongodb";
import { getGiveaway, recordGiveawaySupport, getGiveawaySupportTotal, getGiveawaySupporters } from "../../../../lib/giveaway";

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    // Resolve slug or id to actual giveaway
    const giveaway = await getGiveaway(id);
    if (!giveaway) return res.status(404).json({ error: "Giveaway not found" });
    const giveawayId = giveaway.id;

    // GET: Support totals + supporters list (admin gets full details)
    if (req.method === "GET") {
      let isAdmin = false;
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        try {
          const decoded = verifyToken(token);
          if (decoded) {
            const db = await getDb();
            const user = await db.collection("users").findOne({ _id: decoded.uid });
            if (user?.role === "ADMIN") isAdmin = true;
          }
        } catch {}
      }

      const totals = await getGiveawaySupportTotal(giveawayId);
      const supporters = await getGiveawaySupporters(giveawayId, { isAdmin });
      return res.status(200).json({ ...totals, supporters });
    }

    // POST: Record a support contribution (authenticated user)
    if (req.method === "POST") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "Please log in" });

      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ error: "Invalid token" });

      const { amount, donorName, donorEmail, isAnonymous } = req.body;
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: "Valid amount required" });
      }

      const support = await recordGiveawaySupport(giveawayId, decoded.uid, amount, {
        donorName: donorName || "",
        donorEmail: donorEmail || "",
        isAnonymous: !!isAnonymous,
      });
      return res.status(201).json(support);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Support API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

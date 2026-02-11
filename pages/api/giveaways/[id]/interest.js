import { verifyToken } from "../../../../lib/auth";
import { getDb } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const db = await getDb();

    // GET — count interests + check if current user is interested
    if (req.method === "GET") {
      // Try to resolve giveawayId from slug
      let giveaway = await db.collection("giveaways").findOne({ slug: id });
      if (!giveaway && ObjectId.isValid(id) && id.length === 24) {
        giveaway = await db.collection("giveaways").findOne({ _id: new ObjectId(id) });
      }
      const giveawayId = giveaway ? giveaway._id.toString() : id;

      const count = await db.collection("giveaway_interests").countDocuments({ giveawayId });

      // Check if current user is interested
      let interested = false;
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        try {
          const decoded = verifyToken(token);
          if (decoded) {
            const existing = await db.collection("giveaway_interests").findOne({ giveawayId, userId: decoded.uid });
            interested = !!existing;
          }
        } catch {}
      }

      return res.status(200).json({ count, interested });
    }

    // POST — express interest (auth required)
    if (req.method === "POST") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "Login required" });

      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ error: "Invalid token" });

      const userId = decoded.uid;

      // Check giveaway exists and is upcoming
      let giveaway = null;
      giveaway = await db.collection("giveaways").findOne({ slug: id });
      if (!giveaway && ObjectId.isValid(id) && id.length === 24) {
        giveaway = await db.collection("giveaways").findOne({ _id: new ObjectId(id) });
      }
      if (!giveaway) return res.status(404).json({ error: "Giveaway not found" });
      if (giveaway.status !== "upcoming") {
        return res.status(400).json({ error: "Giveaway is not in upcoming state" });
      }

      // Get user email
      const user = await db.collection("users").findOne(
        { _id: userId },
        { projection: { email: 1, name: 1, displayName: 1 } }
      );

      const giveawayId = giveaway._id.toString();

      // Check if already interested
      const existing = await db.collection("giveaway_interests").findOne({ giveawayId, userId });
      if (existing) {
        // Toggle off — remove interest
        await db.collection("giveaway_interests").deleteOne({ giveawayId, userId });
        const count = await db.collection("giveaway_interests").countDocuments({ giveawayId });
        return res.status(200).json({ interested: false, count });
      }

      // Add interest
      await db.collection("giveaway_interests").insertOne({
        giveawayId,
        userId,
        email: user?.email || "",
        name: user?.name || user?.displayName || "",
        createdAt: new Date(),
      });

      const count = await db.collection("giveaway_interests").countDocuments({ giveawayId });
      return res.status(200).json({ interested: true, count });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Interest API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

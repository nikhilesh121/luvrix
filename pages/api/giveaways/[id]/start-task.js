import { verifyToken } from "../../../../lib/auth";
import { getDb } from "../../../../lib/mongodb";
import { getGiveaway } from "../../../../lib/giveaway";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Please log in" });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ error: "Task ID is required" });

    const giveaway = await getGiveaway(id);
    if (!giveaway) return res.status(404).json({ error: "Giveaway not found" });

    const db = await getDb();

    // Record the start time for this user + task combo
    await db.collection("giveaway_task_starts").updateOne(
      { userId: decoded.uid, taskId, giveawayId: giveaway.id },
      { $set: { startedAt: new Date() } },
      { upsert: true }
    );

    return res.status(200).json({ success: true, startedAt: new Date() });
  } catch (error) {
    console.error("Start task error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

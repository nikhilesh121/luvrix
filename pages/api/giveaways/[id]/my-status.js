import { verifyToken } from "../../../../lib/auth";
import { getGiveaway, getParticipant, getTasksForGiveaway, checkEligibility } from "../../../../lib/giveaway";
import { getDb } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(200).json({ joined: false });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(200).json({ joined: false });

    // Resolve slug or id to actual giveaway to get the real giveawayId
    const giveaway = await getGiveaway(id);
    if (!giveaway) return res.status(200).json({ joined: false });

    const giveawayId = giveaway.id;
    const participant = await getParticipant(giveawayId, decoded.uid);
    if (!participant) return res.status(200).json({ joined: false });

    const tasks = await getTasksForGiveaway(giveawayId);

    // Self-healing: re-check eligibility and fix status if stuck
    let status = participant.status;
    if (status === "participant") {
      const rawTasks = tasks.map(t => {
        try { return { ...t, _id: new ObjectId(t.id) }; } catch { return { ...t, _id: t.id }; }
      });
      if (checkEligibility(participant, giveaway, rawTasks)) {
        status = "eligible";
        const db = await getDb();
        await db.collection("giveaway_participants").updateOne(
          { giveawayId, userId: decoded.uid },
          { $set: { status: "eligible", eligibleAt: new Date() } }
        );
      }
    }

    return res.status(200).json({
      joined: true,
      status,
      points: participant.points,
      inviteCount: participant.inviteCount,
      inviteCode: participant.inviteCode,
      completedTasks: participant.completedTasks || [],
      totalTasks: tasks.length,
      requiredTasksCompleted: tasks.filter(t => t.required).every(t =>
        participant.completedTasks?.includes(t.id)
      ),
    });
  } catch (error) {
    console.error("My status error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

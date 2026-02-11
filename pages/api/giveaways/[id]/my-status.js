import { verifyToken } from '../../../../lib/auth';
import { getGiveaway, getParticipant, getTasksForGiveaway } from '../../../../lib/giveaway';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');
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

    return res.status(200).json({
      joined: true,
      status: participant.status,
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
    console.error('My status error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

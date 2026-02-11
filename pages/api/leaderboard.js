import { getLeaderboardWithAllUsers } from "../../lib/db";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const leaderboard = await getLeaderboardWithAllUsers();
      return res.status(200).json(leaderboard);
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

import { isFollowing } from "../../../lib/db";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { followerId, followingId } = req.query;
      const result = await isFollowing(followerId, followingId);
      return res.status(200).json({ isFollowing: result });
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Follow check API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

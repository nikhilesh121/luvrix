import { getFollowers } from "../../../../lib/db";

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === "GET") {
      const followers = await getFollowers(id);
      return res.status(200).json(followers);
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Followers API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

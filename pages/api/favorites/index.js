import { getUserFavorites, addToFavorites } from "../../../lib/db";
import { withCSRFProtection } from "../../../lib/csrf";

async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }
      const favorites = await getUserFavorites(userId);
      return res.status(200).json(favorites);
    }
    
    if (req.method === "POST") {
      const { userId, itemId, itemType } = req.body;
      const favorite = await addToFavorites(userId, itemId, itemType);
      return res.status(201).json(favorite);
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Favorites API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withCSRFProtection(handler);

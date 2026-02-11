import { verifyToken } from "../../../lib/auth";
import { getUserGiveaways } from "../../../lib/giveaway";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Please log in" });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const giveaways = await getUserGiveaways(decoded.uid);
    return res.status(200).json(giveaways);
  } catch (error) {
    console.error("My giveaways error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

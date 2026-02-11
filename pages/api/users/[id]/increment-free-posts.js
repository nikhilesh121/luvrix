import { getDb } from "../../../../lib/mongodb";
import { verifyToken } from "../../../../lib/auth";
import { withRateLimit } from "../../../../lib/rateLimit";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify the user is authenticated and is the same user
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const { id } = req.query;
    // Only allow users to increment their own count
    if (decoded.uid !== id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const db = await getDb();
    
    const result = await db.collection("users").updateOne(
      { _id: id },
      { $inc: { freePostsUsed: 1 } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error incrementing free posts:", error);
    return res.status(500).json({ error: "Failed to increment free posts" });
  }
}

export default withRateLimit(handler, "api");

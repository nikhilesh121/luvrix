import { getDb } from "../../../../lib/mongodb";
import { withRateLimit } from "../../../../lib/rateLimit";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { slug } = req.query;
    const db = await getDb();
    
    // Use findOneAndUpdate to get the updated document
    const result = await db.collection("manga").findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "Manga not found" });
    }

    // Return the updated view count for real-time updates
    return res.status(200).json({ success: true, views: result.views || 0 });
  } catch (error) {
    console.error("Error incrementing manga views:", error);
    return res.status(500).json({ error: "Failed to increment views" });
  }
}

export default withRateLimit(handler, "content");

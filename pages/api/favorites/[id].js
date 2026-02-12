import { getDb } from "../../../lib/mongodb";
import { withCSRFProtection } from "../../../lib/csrf";

async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: "Missing favorite ID" });
    }

    const db = await getDb();
    const result = await db.collection("favorites").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete favorite error:", error);
    return res.status(500).json({ error: "Failed to remove favorite" });
  }
}

export default withCSRFProtection(handler);

import { getDb } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { withCSRFProtection } from "../../../lib/csrf";

async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const db = await getDb();
      const data = req.body;
      
      let query = { _id: id };
      if (ObjectId.isValid(id) && id.length === 24) {
        query = { _id: new ObjectId(id) };
      }
      
      const result = await db.collection("subscribers").updateOne(
        query,
        { $set: { ...data, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Subscriber not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating subscriber:", error);
      return res.status(500).json({ error: "Failed to update subscriber" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const db = await getDb();
      
      let query = { _id: id };
      if (ObjectId.isValid(id) && id.length === 24) {
        query = { _id: new ObjectId(id) };
      }
      
      await db.collection("subscribers").deleteOne(query);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      return res.status(500).json({ error: "Failed to delete subscriber" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withCSRFProtection(handler);

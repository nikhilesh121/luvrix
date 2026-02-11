import { getDb } from "../../../lib/mongodb";

export default async function handler(req, res) {
  const { txnId } = req.query;

  if (req.method === "GET") {
    try {
      const db = await getDb();
      const payment = await db.collection("payments").findOne({ txnId });
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      return res.status(200).json({ id: payment._id.toString(), ...payment });
    } catch (error) {
      console.error("Error fetching payment:", error);
      return res.status(500).json({ error: "Failed to fetch payment" });
    }
  }

  if (req.method === "PUT") {
    try {
      const db = await getDb();
      const data = req.body;
      
      const result = await db.collection("payments").updateOne(
        { txnId },
        { $set: { ...data, updatedAt: new Date() } }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating payment:", error);
      return res.status(500).json({ error: "Failed to update payment" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

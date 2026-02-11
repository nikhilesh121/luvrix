import { getDb } from "../../../lib/mongodb";

export default async function handler(req, res) {
  const db = await getDb();

  if (req.method === "GET") {
    try {
      const settings = await db.collection("settings").findOne({ type: "payu" });
      if (!settings) {
        return res.status(200).json({
          merchantKey: process.env.PAYU_MERCHANT_KEY || "",
          merchantSalt: process.env.PAYU_MERCHANT_SALT || "",
          isTestMode: process.env.PAYU_TEST_MODE === "true",
          enabled: false
        });
      }
      return res.status(200).json(settings);
    } catch (error) {
      console.error("Error fetching PayU config:", error);
      return res.status(500).json({ error: "Failed to fetch PayU config" });
    }
  }

  if (req.method === "PUT") {
    try {
      const data = req.body;
      await db.collection("settings").updateOne(
        { type: "payu" },
        { $set: { ...data, type: "payu", updatedAt: new Date() } },
        { upsert: true }
      );
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating PayU config:", error);
      return res.status(500).json({ error: "Failed to update PayU config" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

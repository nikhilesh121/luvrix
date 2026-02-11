// Error logging API endpoint
import { getDb } from "../../lib/mongodb";
import { withCSRFProtection } from "../../lib/csrf";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const errorData = req.body;
    
    // Add server-side context
    const enrichedError = {
      ...errorData,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      serverTimestamp: new Date(),
      environment: process.env.NODE_ENV,
    };

    // Store in database
    const db = await getDb();
    await db.collection("error_logs").insertOne(enrichedError);

    // Keep only last 1000 errors (cleanup)
    const count = await db.collection("error_logs").countDocuments();
    if (count > 1000) {
      const oldestToKeep = await db.collection("error_logs")
        .find()
        .sort({ serverTimestamp: -1 })
        .skip(1000)
        .limit(1)
        .toArray();
      
      if (oldestToKeep.length > 0) {
        await db.collection("error_logs").deleteMany({
          serverTimestamp: { $lt: oldestToKeep[0].serverTimestamp }
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error logging failed:", error);
    return res.status(500).json({ error: "Failed to log error" });
  }
}

export default withCSRFProtection(handler);

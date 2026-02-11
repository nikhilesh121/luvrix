import { getDb } from "../../../lib/mongodb";
import { verifyToken } from "../../../lib/auth";

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: "Invalid token" });

  const userId = decoded.uid;
  const db = await getDb();

  if (req.method === "GET") {
    try {
      const sub = await db.collection("subscribers").findOne({ userId });
      return res.status(200).json({
        subscribed: !!sub?.active,
        categories: sub?.categories || [],
        notificationPrefs: sub?.notificationPrefs || { blogs: true, likes: true, follows: true },
      });
    } catch (error) {
      console.error("Get subscription error:", error);
      return res.status(500).json({ error: "Failed to get subscription" });
    }
  }

  if (req.method === "POST") {
    try {
      const { categories, notificationPrefs } = req.body;
      await db.collection("subscribers").updateOne(
        { userId },
        {
          $set: {
            userId,
            active: true,
            categories: categories || [],
            notificationPrefs: notificationPrefs || { blogs: true, likes: true, follows: true },
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );

      // Also update user's notification prefs
      await db.collection("users").updateOne(
        { _id: userId },
        { $set: { notificationPrefs: notificationPrefs || { blogs: true, likes: true, follows: true } } }
      );

      return res.status(200).json({ success: true, message: "Subscribed to notifications" });
    } catch (error) {
      console.error("Subscribe error:", error);
      return res.status(500).json({ error: "Failed to subscribe" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await db.collection("subscribers").updateOne(
        { userId },
        { $set: { active: false, updatedAt: new Date() } }
      );
      return res.status(200).json({ success: true, message: "Unsubscribed" });
    } catch (error) {
      console.error("Unsubscribe error:", error);
      return res.status(500).json({ error: "Failed to unsubscribe" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

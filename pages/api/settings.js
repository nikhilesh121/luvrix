import { getSettings, updateSettings } from "../../lib/db";
import { verifyToken } from "../../lib/auth";
import { getDb } from "../../lib/mongodb";
import { logAdminAction, AUDIT_CATEGORIES } from "../../lib/auditLog";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const settings = await getSettings();
      return res.status(200).json(settings || {});
    }
    
    if (req.method === "PUT") {
      // Admin auth required for PUT
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const db = await getDb();
      const user = await db.collection("users").findOne({ _id: decoded.uid });
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }

      req.user = { uid: decoded.uid, email: user.email, role: user.role };
      await updateSettings(req.body);

      await logAdminAction(req, "settings_update", AUDIT_CATEGORIES.SYSTEM_CONFIG, {
        updatedFields: Object.keys(req.body),
      });

      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Settings API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

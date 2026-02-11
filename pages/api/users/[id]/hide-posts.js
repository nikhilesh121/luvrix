import { getDb } from "../../../../lib/mongodb";
import { withAdmin } from "../../../../lib/auth";
import { logAdminAction, AUDIT_CATEGORIES } from "../../../../lib/auditLog";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    const db = await getDb();
    
    const result = await db.collection("blogs").updateMany(
      { authorId: id },
      { $set: { hidden: true } }
    );

    await logAdminAction(req, "content_update", AUDIT_CATEGORIES.CONTENT_MANAGEMENT, {
      targetUserId: id,
      action: "hide_all_posts",
      postsAffected: result.modifiedCount,
    });

    return res.status(200).json({ success: true, count: result.modifiedCount });
  } catch (error) {
    console.error("Error hiding user posts:", error);
    return res.status(500).json({ error: "Failed to hide posts" });
  }
}

export default withAdmin(handler);

import { likeBlog, getBlog } from "../../../../lib/db";
import { getDb } from "../../../../lib/mongodb";
import { withCSRFProtection } from "../../../../lib/csrf";
import { notifyBlogLiked } from "../../../../lib/notifications";

async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === "POST") {
      const { userId } = req.body;
      await likeBlog(id, userId);
      const blog = await getBlog(id);

      // Send notification to blog author
      if (blog && blog.authorId && blog.authorId !== userId) {
        const db = await getDb();
        const liker = await db.collection("users").findOne({ _id: userId });
        notifyBlogLiked({
          blogId: id,
          blogTitle: blog.title,
          blogAuthorId: blog.authorId,
          likerId: userId,
          likerName: liker?.name || "Someone",
        }).catch(console.error);
      }

      return res.status(200).json({ 
        success: true, 
        likes: blog?.likes?.length || 0,
        likedBy: blog?.likes || []
      });
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Like blog API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withCSRFProtection(handler);

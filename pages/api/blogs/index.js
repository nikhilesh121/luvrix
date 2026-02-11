import { getAllBlogs, getUserBlogs, createBlog } from "../../../lib/db";
import { withCSRFProtection } from "../../../lib/csrf";
import { withRateLimit } from "../../../lib/rateLimit";
import { notifyBlogPublished } from "../../../lib/notifications";

async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  
  try {
    if (req.method === "GET") {
      const { status, userId, all } = req.query;
      
      if (userId) {
        const blogs = await getUserBlogs(userId, status);
        return res.status(200).json(blogs);
      }
      
      // If all=true, fetch all blogs regardless of status (for admin)
      // Otherwise filter by status (default to 'approved' for public)
      const statusFilter = all === "true" ? null : (status || "approved");
      const blogs = await getAllBlogs(statusFilter, true, 500);
      return res.status(200).json(blogs);
    }
    
    if (req.method === "POST") {
      const blogData = req.body;
      const blogId = await createBlog(blogData);

      // If blog is auto-approved, notify followers and subscribers
      if (blogData.status === "approved") {
        notifyBlogPublished({
          blogId,
          blogTitle: blogData.title,
          blogCategory: blogData.category,
          authorId: blogData.authorId,
          authorName: blogData.authorName || "Author",
          thumbnail: blogData.thumbnail,
        }).catch(console.error);
      }

      return res.status(201).json({ success: true, id: blogId });
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Blogs API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Apply content rate limiting then CSRF protection
export default withRateLimit(withCSRFProtection(handler), "content");

import { getBlogDraft, updateBlogDraft, deleteBlogDraft } from "../../../lib/db";
import { withCSRFProtection } from "../../../lib/csrf";

async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === "GET") {
      const draft = await getBlogDraft(id);
      if (!draft) {
        return res.status(404).json({ error: "Draft not found" });
      }
      return res.status(200).json(draft);
    }
    
    if (req.method === "PUT") {
      await updateBlogDraft(id, req.body);
      return res.status(200).json({ success: true });
    }
    
    if (req.method === "DELETE") {
      await deleteBlogDraft(id);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Draft API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withCSRFProtection(handler);

import { getBlogBySlug } from "../../../../lib/db";

export default async function handler(req, res) {
  const { slug } = req.query;
  
  try {
    if (req.method === "GET") {
      const blog = await getBlogBySlug(slug);
      if (!blog) {
        return res.status(404).json({ error: "Blog not found" });
      }
      return res.status(200).json(blog);
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Blog slug API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

import { getMangaBySlug, updateManga, deleteManga } from "../../../lib/db";

export default async function handler(req, res) {
  const { slug } = req.query;
  
  try {
    if (req.method === "GET") {
      const manga = await getMangaBySlug(slug);
      if (!manga) {
        return res.status(404).json({ error: "Manga not found" });
      }
      return res.status(200).json(manga);
    }

    if (req.method === "PUT") {
      const existing = await getMangaBySlug(slug);
      if (!existing) {
        return res.status(404).json({ error: "Manga not found" });
      }

      const data = req.body || {};
      await updateManga(existing.id, data);
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const existing = await getMangaBySlug(slug);
      if (!existing) {
        return res.status(404).json({ error: "Manga not found" });
      }

      await deleteManga(existing.id);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Manga API error:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}

// IndexNow API endpoint — auto-notify Bing, Yandex, etc. when new content is published
import { getDb } from "../../lib/mongodb";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!INDEXNOW_KEY) {
    return res.status(400).json({ error: "INDEXNOW_KEY not configured in environment" });
  }

  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "urls array required" });
    }

    const fullUrls = urls.map(u => u.startsWith("http") ? u : `${SITE_URL}${u}`);

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: new URL(SITE_URL).hostname,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: fullUrls,
      }),
    });

    // Log to DB
    const db = await getDb();
    await db.collection("index_requests").insertOne({
      engine: "indexnow",
      urls: fullUrls,
      status: response.status,
      success: response.ok || response.status === 202,
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: response.ok || response.status === 202,
      status: response.status,
      urlCount: fullUrls.length,
    });
  } catch (error) {
    console.error("IndexNow error:", error);
    return res.status(500).json({ error: error.message });
  }
}

import { getDb } from "../../../lib/mongodb";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

export default async function handler(req, res) {
  try {
    const db = await getDb();

    // Ping Google with the sitemap URL
    const sitemapUrl = `${SITE_URL}/api/sitemap/`;
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const response = await fetch(googlePingUrl);

    // Store last ping timestamp in settings
    const now = new Date();
    await db.collection("settings").updateOne(
      { _id: "main" },
      { $set: { lastGooglePing: now.toISOString() } },
      { upsert: true }
    );

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: "Google ping initiated successfully",
        sitemapUrl,
        lastPing: now.toISOString(),
      });
    } else {
      return res.status(500).json({
        success: false,
        error: "Failed to ping Google",
      });
    }
  } catch (error) {
    console.error("Google ping error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

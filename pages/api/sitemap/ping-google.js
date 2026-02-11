const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

export default async function handler(req, res) {
  try {
    // Ping Google with the sitemap URL
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITE_URL + "/sitemap.xml")}`;
    
    const response = await fetch(googlePingUrl);
    
    if (response.ok) {
      return res.status(200).json({ 
        success: true, 
        message: "Google ping initiated successfully",
        sitemapUrl: `${SITE_URL}/sitemap.xml`
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: "Failed to ping Google" 
      });
    }
  } catch (error) {
    console.error("Google ping error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

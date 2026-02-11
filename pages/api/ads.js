import { getAds } from "../../lib/db";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const ads = await getAds();
      return res.status(200).json(ads);
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Ads API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

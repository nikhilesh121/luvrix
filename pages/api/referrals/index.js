import { getUserReferrals, getReferralStats, generateReferralCode } from "../../../lib/db";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { userId, stats } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      
      if (stats === "true") {
        const referralStats = await getReferralStats(userId);
        return res.status(200).json(referralStats);
      }
      
      const referrals = await getUserReferrals(userId);
      return res.status(200).json(referrals);
    }
    
    if (req.method === "POST") {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      
      const code = await generateReferralCode(userId);
      return res.status(200).json({ code });
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Referrals API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

import { verifyToken } from "../../../../lib/auth";
import { getParticipant, storeWinnerShipping, getWinnerShipping } from "../../../../lib/giveaway";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Please log in" });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    // Only the winner can access shipping details
    const participant = await getParticipant(id, decoded.uid);
    if (!participant || participant.status !== "winner") {
      return res.status(403).json({ error: "Only the winner can access shipping details" });
    }

    // GET: Fetch existing shipping details for the winner
    if (req.method === "GET") {
      const shipping = await getWinnerShipping(id);
      return res.status(200).json({ shipping });
    }

    // POST: Submit or update shipping details
    if (req.method === "POST") {
      const { fullName, address, city, state, pincode, country, phone } = req.body;
      if (!fullName || !address || !city || !state || !pincode || !country || !phone) {
        return res.status(400).json({ error: "All shipping fields are required" });
      }

      await storeWinnerShipping(id, decoded.uid, { fullName, address, city, state, pincode, country, phone });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Shipping error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

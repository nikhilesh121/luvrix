import { verifyToken } from "../../../../lib/auth";
import { processInvite } from "../../../../lib/giveaway";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Please log in" });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ error: "Invite code is required" });

    const result = await processInvite(inviteCode, decoded.uid);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Invite error:", error);
    const status = error.message?.includes("Invalid") ? 404
      : error.message?.includes("cap reached") ? 400
      : error.message?.includes("yourself") ? 400
      : error.message?.includes("must join") ? 400 : 500;
    return res.status(status).json({ error: error.message || "Internal server error" });
  }
}

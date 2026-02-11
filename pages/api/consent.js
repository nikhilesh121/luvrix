/**
 * Consent Audit Trail API
 * Records cookie consent accept/decline for GDPR compliance
 * POST: Record consent decision
 * GET: Retrieve consent status (authenticated users)
 */

import { getDb } from "../../lib/mongodb";
import { withRateLimit } from "../../lib/rateLimit";

async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { accepted, analytics, marketing } = req.body;
      const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      const db = await getDb();
      await db.collection("consent_audit").insertOne({
        type: "cookie_consent",
        accepted: !!accepted,
        categories: {
          essential: true,
          analytics: !!analytics,
          marketing: !!marketing,
        },
        ip,
        userAgent,
        timestamp: new Date(),
        source: "cookie_banner",
      });

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Consent API error:", error);
      return res.status(500).json({ error: "Failed to record consent" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withRateLimit(handler, "api");

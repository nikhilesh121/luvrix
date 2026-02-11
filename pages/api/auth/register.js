import { registerUser } from "../../../lib/auth";
import { withRateLimit } from "../../../lib/rateLimit";

// Note: Register is a public endpoint - CSRF not required (no session yet)
// Rate limited to prevent registration abuse
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, name, photoURL } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    const result = await registerUser(email, password, { name, photoURL });
    
    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Register API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export default withRateLimit(handler, "auth");

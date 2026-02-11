import { getDb } from "../../../lib/mongodb";
import { hashPassword } from "../../../lib/auth";
import { withRateLimit } from "../../../lib/rateLimit";

// Note: Reset-password is a public endpoint - CSRF not required (no session yet)
// Rate limited with OTP config to prevent brute force OTP guessing
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    const db = await getDb();
    
    // Find OTP record
    const resetRecord = await db.collection("passwordResets").findOne({ 
      email: email.toLowerCase() 
    });

    if (!resetRecord) {
      return res.status(400).json({ success: false, error: "No reset request found. Please request a new OTP." });
    }

    // Check attempts
    if (resetRecord.attempts >= 5) {
      await db.collection("passwordResets").deleteOne({ email: email.toLowerCase() });
      return res.status(400).json({ success: false, error: "Too many attempts. Please request a new OTP." });
    }

    // Check expiry
    if (new Date() > new Date(resetRecord.expiresAt)) {
      await db.collection("passwordResets").deleteOne({ email: email.toLowerCase() });
      return res.status(400).json({ success: false, error: "OTP expired. Please request a new one." });
    }

    // Verify OTP
    if (resetRecord.otp !== otp) {
      await db.collection("passwordResets").updateOne(
        { email: email.toLowerCase() },
        { $inc: { attempts: 1 } }
      );
      return res.status(400).json({ success: false, error: "Invalid OTP" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    const result = await db.collection("users").updateOne(
      { email: email.toLowerCase() },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(400).json({ success: false, error: "User not found" });
    }

    // Delete OTP record
    await db.collection("passwordResets").deleteOne({ email: email.toLowerCase() });

    return res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export default withRateLimit(handler, "otp");

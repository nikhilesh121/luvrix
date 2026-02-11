import { getDb } from "../../../../../lib/mongodb";
import { verifyToken, hashPassword } from "../../../../../lib/auth";
import { sendPasswordResetEmail } from "../../../../../utils/email";
import { withRateLimit } from "../../../../../lib/rateLimit";
import { logAdminAction, AUDIT_CATEGORIES } from "../../../../../lib/auditLog";

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const db = await getDb();

    // Check if requester is admin
    const adminUser = await db.collection("users").findOne({ _id: decoded.uid });
    if (!adminUser || adminUser.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.query;

    // Find target user
    const targetUser = await db.collection("users").findOne({ _id: id });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate temp password and hash it
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    // Update user password
    await db.collection("users").updateOne(
      { _id: id },
      {
        $set: {
          password: hashedPassword,
          passwordResetAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Send email with new password
    let emailSent = false;
    if (targetUser.email) {
      const result = await sendPasswordResetEmail(
        targetUser.email,
        targetUser.name || "User",
        tempPassword
      );
      emailSent = result.success;
    }

    // Audit log the action
    req.user = { uid: decoded.uid, email: adminUser.email, role: adminUser.role };
    await logAdminAction(req, "admin_reset_password", AUDIT_CATEGORIES.USER_MANAGEMENT, {
      targetUserId: id,
      targetEmail: targetUser.email,
      emailSent,
    });

    return res.status(200).json({
      success: true,
      message: emailSent
        ? `Password reset. New password sent to ${targetUser.email}`
        : `Password reset. Email could not be sent. Temp password: ${tempPassword}`,
      emailSent,
      tempPassword: emailSent ? undefined : tempPassword,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
}

export default withRateLimit(handler, "admin");

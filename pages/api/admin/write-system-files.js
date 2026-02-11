import fs from "fs";
import path from "path";
import { withAdmin } from "../../../lib/auth";
import { logAdminAction, AUDIT_CATEGORIES } from "../../../lib/auditLog";

const PUBLIC_DIR = path.join(process.cwd(), "public");

function safeWriteAndVerify(filePath, content) {
  // Check directory exists and is writable
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    throw new Error(`Directory does not exist: ${dir}`);
  }
  try {
    fs.accessSync(dir, fs.constants.W_OK);
  } catch {
    throw new Error(`Directory is not writable: ${dir}`);
  }

  // Backup existing file
  if (fs.existsSync(filePath)) {
    const backup = fs.readFileSync(filePath, "utf8");
    fs.writeFileSync(filePath + ".bak", backup, "utf8");
  }

  // Write new content
  fs.writeFileSync(filePath, content, { encoding: "utf8", mode: 0o644 });

  // Read-back verification
  const written = fs.readFileSync(filePath, "utf8");
  if (written !== content) {
    throw new Error("Read-back verification failed: written content does not match");
  }

  return true;
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { robotsTxt, adsTxt } = req.body;
    const results = { robots: null, ads: null };
    const errors = [];

    console.log("[write-system-files] PUBLIC_DIR:", PUBLIC_DIR);

    // Write robots.txt
    if (typeof robotsTxt === "string") {
      try {
        const robotsPath = path.join(PUBLIC_DIR, "robots.txt");
        safeWriteAndVerify(robotsPath, robotsTxt);
        results.robots = "success";
        console.log("[write-system-files] robots.txt written and verified at", robotsPath);
      } catch (err) {
        console.error("[write-system-files] robots.txt write error:", err.message);
        errors.push(`robots.txt: ${err.message}`);
        results.robots = "failed";
      }
    }

    // Write ads.txt
    if (typeof adsTxt === "string") {
      try {
        const adsPath = path.join(PUBLIC_DIR, "ads.txt");
        safeWriteAndVerify(adsPath, adsTxt);
        results.ads = "success";
        console.log("[write-system-files] ads.txt written and verified at", adsPath);
      } catch (err) {
        console.error("[write-system-files] ads.txt write error:", err.message);
        errors.push(`ads.txt: ${err.message}`);
        results.ads = "failed";
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({
        success: false,
        message: "Some files failed to write",
        results,
        errors,
      });
    }

    // Audit log the action
    await logAdminAction(req, "system_config_update", AUDIT_CATEGORIES.SYSTEM_CONFIG, {
      filesWritten: results,
    });

    return res.status(200).json({
      success: true,
      message: "System files updated successfully",
      results,
    });
  } catch (error) {
    console.error("Write system files error:", error);
    return res.status(500).json({ error: "Failed to write system files" });
  }
}

export default withAdmin(handler);

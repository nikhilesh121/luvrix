import { getSettings } from "../../lib/db";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  try {
    // Try DB first (most up-to-date)
    const settings = await getSettings();
    if (settings && settings.adsTxt) {
      // Also sync to physical file if it differs
      try {
        const filePath = path.join(process.cwd(), "public", "ads.txt");
        const currentFile = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
        if (currentFile !== settings.adsTxt) {
          fs.writeFileSync(filePath, settings.adsTxt, { encoding: "utf8", mode: 0o644 });
        }
      } catch (syncErr) {
        console.error("[ads-txt] File sync error:", syncErr.message);
      }

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
      return res.status(200).send(settings.adsTxt);
    }

    // Fallback to physical file
    const filePath = path.join(process.cwd(), "public", "ads.txt");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
      return res.status(200).send(content);
    }

    return res.status(404).send("# ads.txt not configured");
  } catch (error) {
    console.error("[ads-txt] Error:", error);
    try {
      const filePath = path.join(process.cwd(), "public", "ads.txt");
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.status(200).send(content);
      }
    } catch {}
    return res.status(500).send("# Error loading ads.txt");
  }
}

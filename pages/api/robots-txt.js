import { getSettings } from '../../lib/db';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    // Try DB first (most up-to-date)
    const settings = await getSettings();
    if (settings && settings.robotsTxt) {
      // Also sync to physical file if it differs
      try {
        const filePath = path.join(process.cwd(), 'public', 'robots.txt');
        const currentFile = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
        if (currentFile !== settings.robotsTxt) {
          fs.writeFileSync(filePath, settings.robotsTxt, { encoding: 'utf8', mode: 0o644 });
        }
      } catch (syncErr) {
        console.error('[robots-txt] File sync error:', syncErr.message);
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      return res.status(200).send(settings.robotsTxt);
    }

    // Fallback to physical file
    const filePath = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      return res.status(200).send(content);
    }

    return res.status(404).send('# robots.txt not configured');
  } catch (error) {
    console.error('[robots-txt] Error:', error);
    // Last resort: serve physical file
    try {
      const filePath = path.join(process.cwd(), 'public', 'robots.txt');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send(content);
      }
    } catch {}
    return res.status(500).send('# Error loading robots.txt');
  }
}

import fs from 'fs';
import path from 'path';
import { getDb } from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: decoded.uid });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { robotsTxt, adsTxt } = req.body;
    const results = { robots: null, ads: null };
    const errors = [];

    // Write robots.txt
    if (typeof robotsTxt === 'string') {
      try {
        const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
        // Backup current file
        if (fs.existsSync(robotsPath)) {
          const backup = fs.readFileSync(robotsPath, 'utf8');
          fs.writeFileSync(robotsPath + '.bak', backup, 'utf8');
        }
        fs.writeFileSync(robotsPath, robotsTxt, 'utf8');
        results.robots = 'success';
      } catch (err) {
        errors.push(`robots.txt: ${err.message}`);
        results.robots = 'failed';
      }
    }

    // Write ads.txt
    if (typeof adsTxt === 'string') {
      try {
        const adsPath = path.join(PUBLIC_DIR, 'ads.txt');
        // Backup current file
        if (fs.existsSync(adsPath)) {
          const backup = fs.readFileSync(adsPath, 'utf8');
          fs.writeFileSync(adsPath + '.bak', backup, 'utf8');
        }
        fs.writeFileSync(adsPath, adsTxt, 'utf8');
        results.ads = 'success';
      } catch (err) {
        errors.push(`ads.txt: ${err.message}`);
        results.ads = 'failed';
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({
        success: false,
        message: 'Some files failed to write',
        results,
        errors,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'System files updated successfully',
      results,
    });
  } catch (error) {
    console.error('Write system files error:', error);
    return res.status(500).json({ error: 'Failed to write system files' });
  }
}

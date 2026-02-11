# Step 1: Go to your project directory
cd /path/to/your/WebApp

# Step 2: Pull latest code
git pull origin main

# Step 3: Install any new dependencies (skip if none added)
npm install

# Step 4: Build the Next.js app (REQUIRED — this compiles the API routes)
npm run build

# Step 5: Restart PM2 (or whatever process manager you use)
pm2 restart luvrix
# OR if you use a different name:
# pm2 restart all

# Step 6: Clear Nginx proxy cache (CRITICAL for sitemap fix)
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx

# Step 7: Verify sitemaps are live (should show all 12 posts)
curl -I https://luvrix.com/sitemap-posts.xml
# Look for: Cache-Control: private, no-store, no-cache...
# Look for: X-Accel-Expires: 0
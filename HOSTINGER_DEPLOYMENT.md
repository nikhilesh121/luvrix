# Frontend-Backend Separation Guide

> ⚠️ **IMPORTANT SEO WARNING**: Hostinger Business hosting doesn't support Node.js. 
> Static export will **lose SSR** (Server-Side Rendering), which means:
> - Pages won't have meta tags pre-rendered for Google
> - Dynamic content won't be visible to search engines initially
> - The SEO fixes we implemented will be partially negated
>
> **Recommended**: Keep everything on current VPS OR use Hostinger VPS (supports Node.js)

## Architecture Overview

```
┌─────────────────────┐     API Calls      ┌─────────────────────┐
│   HOSTINGER         │ ─────────────────> │   THIS SERVER       │
│   (Frontend)        │                    │   (Backend API)     │
│                     │                    │                     │
│   luvrix.com        │                    │   api.luvrix.com    │
│   Static HTML/JS    │                    │   Node.js + PM2     │
│                     │                    │   MongoDB           │
└─────────────────────┘                    └─────────────────────┘
```

## Step 1: DNS Configuration (Cloudflare)

Add a new DNS record for the API subdomain:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | api | 38.146.28.243 | Proxied (orange cloud) |

## Step 2: Backend Server Setup (This Server)

The backend is already configured. It will continue running at:
- **URL:** `https://api.luvrix.com`
- **Handles:** All `/api/*` routes, sitemaps, authentication

### Nginx Configuration for api.luvrix.com

Create `/etc/nginx/sites-available/api.luvrix.com`:

```nginx
server {
    listen 80;
    server_name api.luvrix.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/api.luvrix.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Step 3: Build Static Frontend

```bash
# On this server, build the static export
cd /var/www/luvrix
NEXT_PUBLIC_API_URL=https://api.luvrix.com npm run build:static

# The static files will be in the 'out' directory
```

## Step 4: Upload to Hostinger

### Option A: File Manager
1. Log in to Hostinger hPanel
2. Go to **Files** → **File Manager**
3. Navigate to `public_html`
4. Delete existing files (backup first if needed)
5. Upload all files from the `out` directory

### Option B: FTP Upload
1. Get FTP credentials from Hostinger hPanel → **Files** → **FTP Accounts**
2. Use FileZilla or similar FTP client
3. Connect and upload contents of `out` directory to `public_html`

### Option C: Git Deploy (if available)
1. Push static build to a separate branch
2. Connect Hostinger to GitHub repository
3. Deploy from the static branch

## Step 5: Hostinger .htaccess Configuration

Create `.htaccess` in `public_html`:

```apache
# Enable rewrite engine
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle trailing slashes (Next.js uses trailing slashes)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !(.*)/$
RewriteRule ^(.*)$ /$1/ [L,R=301]

# Handle client-side routing (SPA fallback)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# CORS headers for fonts
<IfModule mod_headers.c>
    <FilesMatch "\.(ttf|ttc|otf|eot|woff|woff2|font.css|css)$">
        Header set Access-Control-Allow-Origin "*"
    </FilesMatch>
</IfModule>
```

## Step 6: Update Cloudflare DNS

Change the main domain to point to Hostinger:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | [Hostinger IP] | Proxied |
| A | www | [Hostinger IP] | Proxied |
| A | api | 38.146.28.243 | Proxied |

Get Hostinger's IP from hPanel → **Hosting** → **Details**

## Step 7: SSL Certificates

### Hostinger (Frontend)
- SSL is usually auto-provisioned by Hostinger
- Check hPanel → **SSL** to ensure it's active

### This Server (Backend API)
- Cloudflare provides SSL via proxy
- Or use Certbot: `certbot --nginx -d api.luvrix.com`

## Verification Checklist

- [ ] `https://api.luvrix.com/api/health` returns 200
- [ ] `https://luvrix.com` loads the homepage
- [ ] Login/logout works
- [ ] Blog posts load correctly
- [ ] Manga pages load correctly
- [ ] Giveaway pages work
- [ ] Admin panel accessible

## Environment Variables

### Backend (.env.local on this server)
```env
NEXT_PUBLIC_SITE_URL=https://luvrix.com
NEXT_PUBLIC_API_URL=https://api.luvrix.com
MONGODB_URI=mongodb://localhost:27017/luvrix
# ... other existing env vars
```

### Frontend (build-time)
```env
NEXT_PUBLIC_API_URL=https://api.luvrix.com
NEXT_PUBLIC_SITE_URL=https://luvrix.com
```

## Troubleshooting

### CORS Errors
- Check that `api.luvrix.com` is in the ALLOWED_ORIGINS in middleware.js
- Verify Cloudflare isn't stripping CORS headers

### API Not Reachable
- Verify DNS propagation: `dig api.luvrix.com`
- Check nginx is running: `systemctl status nginx`
- Check PM2 is running: `pm2 status`

### Static Pages Not Loading
- Ensure all files uploaded to public_html
- Check .htaccess is present and correct
- Verify Hostinger PHP version supports mod_rewrite

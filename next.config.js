/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['cdn.manhuain.com', 'luvrix.com', 'localhost'],
  },
  trailingSlash: true,
  compress: true,
  swcMinify: true,
  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  generateEtags: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/sitemap:path*.xml',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
          { key: 'X-Accel-Expires', value: '0' },
        ],
      },
      {
        source: '/api/sitemap/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
          { key: 'X-Accel-Expires', value: '0' },
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:all*(js|css)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://adservice.google.com wss: ws:; frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com; frame-ancestors 'none';" },
        ],
      },
    ];
  },
  // All sitemap .xml URLs redirect to API routes (prevents CDN caching of stale XML)
  async redirects() {
    return [
      { source: '/sitemap.xml', destination: '/api/sitemap/', permanent: true },
      { source: '/sitemap-pages.xml', destination: '/api/sitemap/pages/', permanent: true },
      { source: '/sitemap-posts.xml', destination: '/api/sitemap/posts/', permanent: true },
      { source: '/sitemap-manga.xml', destination: '/api/sitemap/manga/', permanent: true },
      { source: '/sitemap-categories.xml', destination: '/api/sitemap/categories/', permanent: true },
      { source: '/sitemap-giveaways.xml', destination: '/api/sitemap/giveaways/', permanent: true },
    ];
  },
};

module.exports = nextConfig;

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
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Headers for caching and security
  async headers() {
    return [
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
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
  // Sitemap rewrites
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      {
        source: '/sitemap-pages.xml',
        destination: '/api/sitemap/pages',
      },
      {
        source: '/sitemap-posts.xml',
        destination: '/api/sitemap/posts',
      },
      {
        source: '/sitemap-manga.xml',
        destination: '/api/sitemap/manga',
      },
      {
        source: '/sitemap-chapters.xml',
        destination: '/api/sitemap/chapters',
      },
      {
        source: '/sitemap-categories.xml',
        destination: '/api/sitemap/categories',
      },
    ];
  },
};

module.exports = nextConfig;

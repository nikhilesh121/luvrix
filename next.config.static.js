/** @type {import('next').NextConfig} */
// Static Export Configuration for Hostinger
// Use: npm run build:static

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  compress: true,
  swcMinify: true,
  poweredByHeader: false,
  reactStrictMode: true,
  generateEtags: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: true,
  },
  // Environment variable for API URL (set to backend server)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.luvrix.com',
  },
};

module.exports = nextConfig;

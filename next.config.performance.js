/**
 * Performance Optimization Configuration
 * Sprint 7 - Lighthouse 90+ Target
 * 
 * This file contains recommended Next.js config additions for optimal performance
 */

const performanceConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable SWC minification
  swcMinify: true,

  // Compress responses
  compress: true,

  // Generate ETags for caching
  generateEtags: true,

  // Optimize fonts
  optimizeFonts: true,

  // Production source maps (disabled for smaller bundles)
  productionBrowserSourceMaps: false,

  // Experimental optimizations
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations only
    if (!dev && !isServer) {
      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier());
            },
            name(module) {
              const hash = require('crypto')
                .createHash('sha1')
                .update(module.identifier())
                .digest('hex')
                .substring(0, 8);
              return `lib-${hash}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              const hash = require('crypto')
                .createHash('sha1')
                .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                .digest('hex')
                .substring(0, 8);
              return `shared-${hash}`;
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },
};

module.exports = performanceConfig;

/**
 * Usage in next.config.js:
 * 
 * const performanceConfig = require('./next.config.performance');
 * 
 * module.exports = {
 *   ...performanceConfig,
 *   // your other config
 * };
 */

/**
 * Lighthouse Optimization Checklist:
 * 
 * PERFORMANCE (Target: 90+)
 * ✅ Enable image optimization with next/image
 * ✅ Use WebP/AVIF formats
 * ✅ Implement lazy loading for images
 * ✅ Minimize JavaScript bundle size
 * ✅ Enable compression
 * ✅ Use efficient cache policies
 * ✅ Eliminate render-blocking resources
 * ✅ Preconnect to required origins
 * 
 * ACCESSIBILITY (Target: 90+)
 * - Add alt text to all images
 * - Ensure sufficient color contrast
 * - Use semantic HTML elements
 * - Add ARIA labels where needed
 * - Ensure keyboard navigation works
 * 
 * BEST PRACTICES (Target: 90+)
 * ✅ Use HTTPS
 * ✅ Avoid deprecated APIs
 * ✅ Console has no errors
 * 
 * SEO (Target: 90+)
 * ✅ Add meta descriptions
 * ✅ Use semantic headings
 * ✅ Add hreflang tags (Sprint 7)
 * ✅ Ensure robots can crawl
 */

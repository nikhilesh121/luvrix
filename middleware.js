import { NextResponse } from 'next/server';

// Spam/low-value query parameters that should be stripped
const SPAM_PARAMS = [
  'amp', 'noamp', 'share', 'add_to_wishlist', 'orderby',
  'type', 'replytocom', 'product-page', 'nb',
];

// Paths that should never be indexed
const NOINDEX_PATHS = [
  '/admin', '/dashboard', '/login', '/register',
  '/favorites', '/profile', '/create-blog', '/edit-blog',
  '/preview-blog', '/payment-success', '/payment-failed',
  '/user',
  '/api',
];

// Pagination pattern
const PAGINATION_REGEX = /\/page\/\d+/;
// Feed pattern
const FEED_REGEX = /\/feed\/?$/;

// Sitemap .xml → internal rewrite to /sitemaps/ SSR pages
// URL stays as .xml in the browser but content is served fresh from SSR pages
const SITEMAP_REWRITES = {
  '/sitemap.xml': '/sitemaps/',
  '/sitemap-pages.xml': '/sitemaps/pages/',
  '/sitemap-posts.xml': '/sitemaps/posts/',
  '/sitemap-manga.xml': '/sitemaps/manga/',
  '/sitemap-categories.xml': '/sitemaps/categories/',
  '/sitemap-giveaways.xml': '/sitemaps/giveaways/',
};

export function middleware(request) {
  const url = request.nextUrl.clone();
  const { pathname, searchParams } = url;

  // 0a. Chapter pages permanently removed — return 410 Gone so Google de-indexes them
  if (/^\/manga\/[^/]+\/chapter/.test(pathname.replace(/\/$/, ''))) {
    return new NextResponse('Gone', { status: 410, headers: { 'X-Robots-Tag': 'noindex' } });
  }

  // 0b. Sitemap .xml → internal rewrite to /sitemaps/ SSR pages (URL stays as .xml)
  const sitemapDest = SITEMAP_REWRITES[pathname];
  if (sitemapDest) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = sitemapDest;
    return NextResponse.rewrite(rewriteUrl);
  }

  // 1. Strip spam query parameters and redirect to clean URL
  let hasSpamParam = false;
  for (const param of SPAM_PARAMS) {
    if (searchParams.has(param)) {
      searchParams.delete(param);
      hasSpamParam = true;
    }
  }

  if (hasSpamParam) {
    url.search = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return NextResponse.redirect(url, 301);
  }

  // 2. Add noindex headers for paths that should not be indexed
  const response = NextResponse.next();

  const shouldNoindex =
    (NOINDEX_PATHS.some(p => pathname.startsWith(p)) && !pathname.startsWith('/api/sitemap') && !pathname.startsWith('/sitemaps')) ||
    PAGINATION_REGEX.test(pathname) ||
    FEED_REGEX.test(pathname);

  if (shouldNoindex) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and _next
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|apple-touch-icon\\.svg|manifest\\.json|og-default\\.svg|default-blog\\.svg).*)',
  ],
};

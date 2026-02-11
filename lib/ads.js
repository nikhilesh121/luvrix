/**
 * Central Ad Configuration & Safety Utilities
 * 
 * Single source of truth for ad positions, safety rules,
 * and helper functions used across blog/manga pages.
 */

// Default interval: insert an ad every N substantial paragraphs
export const DEFAULT_BLOG_AD_INTERVAL = 4;

// Positions where ads should lazy-load (below the fold)
export const LAZY_AD_POSITIONS = [
  "content_middle",
  "content_bottom",
  "blog_bottom",
  "footer_above",
  "footer_inside",
  "sticky_bottom",
  "between_posts",
];

// Pages where ads must NEVER appear
export const AD_BLOCKED_ROUTES = [
  "/admin",
  "/login",
  "/register",
  "/error",
  "/create-blog",
  "/edit-blog",
  "/preview-blog",
  "/dashboard",
];

/**
 * Determine if a blog post should show ads.
 * Checks global settings, post-level overrides, and content safety.
 */
export function shouldShowBlogAds(settings, blog) {
  // Global kill switch
  if (!settings?.adsEnabled) return false;

  // Per-post override: blog.adsEnabled === false means author/admin disabled ads
  if (blog?.adsEnabled === false) return false;

  // Don't show ads on drafts, pending, or hidden posts
  if (blog?.status && blog.status !== "approved") return false;

  // Don't show ads on thin content (< 300 chars of text)
  if (blog?.content) {
    const textLength = blog.content.replace(/<[^>]*>/g, "").trim().length;
    if (textLength < 300) return false;
  }

  return true;
}

/**
 * Get the allowed ad placements for a blog post.
 * Returns { top: bool, inContent: bool, bottom: bool }
 */
export function getBlogAdPlacements(settings, blog) {
  const defaults = { top: true, inContent: true, bottom: true };

  // Per-post overrides
  if (blog?.adPlacements) {
    return {
      top: blog.adPlacements.includes("top"),
      inContent: blog.adPlacements.includes("inContent"),
      bottom: blog.adPlacements.includes("bottom"),
    };
  }

  return defaults;
}

/**
 * Get the ad interval for in-content ads.
 * Priority: per-post > global setting > default
 */
export function getBlogAdInterval(settings, blog) {
  if (blog?.adInterval && blog.adInterval > 0) return blog.adInterval;
  if (settings?.blogAdInterval && settings.blogAdInterval > 0) return settings.blogAdInterval;
  return DEFAULT_BLOG_AD_INTERVAL;
}

/**
 * Check if an HTML block is "safe" for ad insertion after it.
 * Ads must NOT appear directly after headings, inside quotes,
 * inside code blocks, or inside figures.
 */
export function isSafeAdBreak(htmlBlock) {
  if (!htmlBlock) return false;
  const trimmed = htmlBlock.trim();

  // Don't place ads right after headings
  if (/<\/h[1-6]>\s*$/i.test(trimmed)) return false;

  // Don't place ads inside/after blockquotes
  if (/<\/blockquote>\s*$/i.test(trimmed)) return false;

  // Don't place ads inside/after code blocks
  if (/<\/pre>\s*$/i.test(trimmed)) return false;
  if (/<\/code>\s*$/i.test(trimmed)) return false;

  // Don't place ads inside/after figures (images with captions)
  if (/<\/figure>\s*$/i.test(trimmed)) return false;

  // Don't place ads after very short blocks (likely subheadings or captions)
  const textOnly = trimmed.replace(/<[^>]*>/g, "").trim();
  if (textOnly.length < 50) return false;

  return true;
}

import { useMemo, useEffect, useRef, useState } from 'react';
import AdRenderer from './AdRenderer';
import { isSafeAdBreak, getBlogAdInterval } from '../lib/ads';

/**
 * BlogContentRenderer — Block-based blog content renderer with:
 *
 *  - Mobile-first typography & spacing
 *  - Smart in-content ad injection (safe breaks only)
 *  - Lazy-loaded ads with CLS-safe containers
 *  - Enhanced styling for quotes, callouts, code, images, videos
 *  - Admin-controlled ad interval
 *
 * Supports content blocks: text, headings, images, videos,
 * blockquotes, callouts, code, tables, lists, CTAs.
 */

// ─── Prose class sets per template ──────────────────────────
export const PROSE_CLASSES = {
  default: `blog-content prose prose-base sm:prose-lg max-w-none
    prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-headings:break-words
    prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
    prose-h2:text-xl sm:prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-10 md:prose-h2:mt-12 prose-h2:mb-4
    prose-h3:text-lg sm:prose-h3:text-xl md:prose-h3:text-2xl prose-h3:mt-8 md:prose-h3:mt-10 prose-h3:mb-3
    prose-p:text-gray-700 dark:prose-p:text-gray-200 prose-p:leading-relaxed sm:prose-p:leading-loose prose-p:mb-5
    prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:break-words
    prose-img:rounded-xl prose-img:shadow-md prose-img:w-full prose-img:my-6
    prose-figure:my-8
    prose-blockquote:border-l-4 prose-blockquote:border-primary/60 prose-blockquote:bg-primary/5 dark:prose-blockquote:bg-primary/10 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:my-6 prose-blockquote:not-italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-200
    prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-code:text-sm prose-code:break-words prose-code:before:content-none prose-code:after:content-none
    prose-pre:bg-gray-900 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:my-6 prose-pre:text-sm
    prose-ul:my-4 prose-ol:my-4 prose-li:my-1 prose-li:text-gray-700 dark:prose-li:text-gray-200
    prose-table:my-6 prose-table:overflow-x-auto
    prose-hr:my-8 prose-hr:border-gray-200 dark:prose-hr:border-gray-700
    prose-strong:text-gray-900 dark:prose-strong:text-white`,

  magazine: `blog-content prose prose-base md:prose-lg max-w-none
    prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
    prose-p:text-gray-700 dark:prose-p:text-gray-200 prose-p:leading-loose
    prose-a:text-primary prose-img:rounded-xl prose-img:shadow-lg
    prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50 dark:prose-blockquote:bg-amber-900/20 prose-blockquote:rounded-r-xl
    prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
    prose-pre:bg-gray-900 prose-pre:rounded-xl
    prose-strong:text-gray-900 dark:prose-strong:text-white prose-li:text-gray-700 dark:prose-li:text-gray-200`,

  minimal: `blog-content prose prose-lg max-w-none
    prose-headings:font-serif prose-headings:text-gray-900 dark:prose-headings:text-gray-100
    prose-p:text-gray-600 dark:prose-p:text-gray-200 prose-p:leading-loose prose-p:text-lg
    prose-a:text-primary prose-img:rounded-lg
    prose-blockquote:border-l-2 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:italic
    prose-code:bg-gray-50 dark:prose-code:bg-gray-800 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
    prose-pre:bg-gray-900 prose-pre:rounded-lg
    prose-strong:text-gray-900 dark:prose-strong:text-white prose-li:text-gray-600 dark:prose-li:text-gray-200`,

  cinematic: `blog-content prose prose-lg max-w-none
    prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
    prose-p:text-gray-700 dark:prose-p:text-gray-200 prose-p:leading-loose
    prose-a:text-primary prose-img:rounded-xl prose-img:shadow-xl
    prose-blockquote:border-l-4 prose-blockquote:border-gray-800 dark:prose-blockquote:border-gray-500 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800/50 prose-blockquote:rounded-r-xl
    prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
    prose-pre:bg-gray-950 prose-pre:rounded-xl
    prose-strong:text-gray-900 dark:prose-strong:text-white prose-li:text-gray-700 dark:prose-li:text-gray-200`,

  newsletter: `blog-content prose prose-base md:prose-lg max-w-none
    prose-headings:font-extrabold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
    prose-p:text-gray-600 dark:prose-p:text-gray-200 prose-p:leading-relaxed
    prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-xl
    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:rounded-r-xl
    prose-code:bg-blue-50 dark:prose-code:bg-blue-900/30 prose-code:text-blue-700 dark:prose-code:text-blue-300 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
    prose-pre:bg-gray-900 prose-pre:rounded-xl
    prose-strong:text-gray-900 dark:prose-strong:text-white prose-li:text-gray-600 dark:prose-li:text-gray-200`,

  bold: `blog-content prose prose-lg max-w-none
    prose-headings:font-black prose-headings:text-gray-900 dark:prose-headings:text-gray-100
    prose-p:text-gray-700 dark:prose-p:text-gray-200 prose-p:leading-loose
    prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-img:rounded-2xl prose-img:shadow-lg
    prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:bg-purple-50 dark:prose-blockquote:bg-purple-900/20 prose-blockquote:rounded-r-xl
    prose-code:bg-purple-50 dark:prose-code:bg-purple-900/30 prose-code:text-purple-700 dark:prose-code:text-purple-300 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
    prose-pre:bg-gray-900 prose-pre:rounded-xl
    prose-strong:text-gray-900 dark:prose-strong:text-white prose-li:text-gray-700 dark:prose-li:text-gray-200`,

  video: `blog-content prose prose-lg max-w-none
    prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
    prose-p:text-gray-700 dark:prose-p:text-gray-200 prose-p:leading-relaxed
    prose-a:text-red-600 dark:prose-a:text-red-400 prose-img:rounded-xl prose-img:shadow-lg
    prose-blockquote:border-l-4 prose-blockquote:border-red-500 prose-blockquote:bg-red-50 dark:prose-blockquote:bg-red-900/20 prose-blockquote:rounded-r-xl
    prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
    prose-pre:bg-gray-900 prose-pre:rounded-xl
    prose-strong:text-gray-900 dark:prose-strong:text-white prose-li:text-gray-700 dark:prose-li:text-gray-200`,
};

// ─── Video embed helper ─────────────────────────────────────
function getVideoEmbedUrl(url) {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Direct embed URL
  if (url.includes('embed') || url.includes('player')) return url;
  return null;
}

// ─── Media block renderer ───────────────────────────────────
function MediaBlock({ item }) {
  if (!item?.url) return null;

  if (item.type === 'video') {
    const embedUrl = getVideoEmbedUrl(item.url);
    if (!embedUrl) return null;
    return (
      <figure className="my-8 sm:my-10 not-prose">
        <div className="relative w-full rounded-xl overflow-hidden shadow-md bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            title={item.caption || 'Video'}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        {item.caption && (
          <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2.5 px-2">{item.caption}</figcaption>
        )}
      </figure>
    );
  }

  // Image
  return (
    <figure className="my-8 sm:my-10 not-prose">
      <div className="rounded-xl overflow-hidden shadow-md bg-gray-100 dark:bg-gray-800">
        <img
          src={item.url}
          alt={item.caption || ''}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
      </div>
      {item.caption && (
        <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2.5 px-2">{item.caption}</figcaption>
      )}
    </figure>
  );
}

// ─── Main renderer ──────────────────────────────────────────
export default function BlogContentRenderer({ html, settings, blog, template = 'default', adsEnabled = true }) {
  const interval = getBlogAdInterval(settings, blog);
  const proseClass = PROSE_CLASSES[template] || PROSE_CLASSES.default;
  const shouldShowAds = adsEnabled && settings?.adsEnabled;
  const mediaItems = blog?.mediaItems || [];

  const chunks = useMemo(() => {
    if (!html) return [];
    const parts = html.split(/(<\/(?:p|h[1-6]|blockquote|ul|ol|div|figure|table|pre|section)>)/gi);

    const blocks = [];
    let current = '';
    for (let i = 0; i < parts.length; i++) {
      current += parts[i];
      if (/^<\/(?:p|h[1-6]|blockquote|ul|ol|div|figure|table|pre|section)>$/i.test(parts[i])) {
        blocks.push(current);
        current = '';
      }
    }
    if (current.trim()) blocks.push(current);

    const grouped = [];
    let group = '';
    let paraCount = 0;
    for (const block of blocks) {
      group += block;
      if (block.replace(/<[^>]*>/g, '').trim().length > 20) {
        paraCount++;
      }
      if (paraCount >= interval && isSafeAdBreak(block)) {
        grouped.push(group);
        group = '';
        paraCount = 0;
      }
    }
    if (group.trim()) grouped.push(group);

    return grouped;
  }, [html, interval]);

  // Build a lookup: which media items go after which chunk index
  const mediaByChunk = useMemo(() => {
    const map = {};
    for (const item of mediaItems) {
      const idx = Math.max(0, (item.position || 1) - 1);
      if (!map[idx]) map[idx] = [];
      map[idx].push(item);
    }
    return map;
  }, [mediaItems]);

  const hasMedia = mediaItems.length > 0;

  // No ads AND no media → plain render
  if ((!shouldShowAds && !hasMedia) || chunks.length <= 1) {
    // Still render media even for single-chunk content
    if (hasMedia && chunks.length >= 1) {
      return (
        <div className={proseClass}>
          {chunks.map((chunk, i) => (
            <div key={i}>
              <div dangerouslySetInnerHTML={{ __html: chunk }} />
              {mediaByChunk[i]?.map((item, mi) => <MediaBlock key={`m-${i}-${mi}`} item={item} />)}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className={proseClass} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  return (
    <div className={proseClass}>
      {chunks.map((chunk, i) => (
        <div key={i}>
          <div dangerouslySetInnerHTML={{ __html: chunk }} />
          {/* Media items for this position */}
          {mediaByChunk[i]?.map((item, mi) => <MediaBlock key={`m-${i}-${mi}`} item={item} />)}
          {/* Ad slot between chunks */}
          {shouldShowAds && i < chunks.length - 1 && (
            <LazyInContentAd settings={settings} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Lazy in-content ad slot ────────────────────────────────
function LazyInContentAd({ settings }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="my-8 sm:my-10 flex justify-center not-prose"
      style={{ minHeight: '100px' }}
    >
      {visible ? (
        <div className="w-full max-w-2xl">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mb-1 uppercase tracking-widest select-none">
            Advertisement
          </p>
          <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-800/50">
            <AdRenderer position="content_middle" settings={settings} className="w-full" />
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl" aria-hidden="true" />
      )}
    </div>
  );
}

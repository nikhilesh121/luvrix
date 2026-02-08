import { useMemo, useEffect, useRef, useState } from 'react';
import AdRenderer from './AdRenderer';
import { isSafeAdBreak, getBlogAdInterval } from '../lib/ads';

/**
 * BlogContentWithAds - Renders blog HTML content with ads injected between paragraphs
 * 
 * Features:
 * - Reads ad interval from admin settings (settings.blogAdInterval)
 * - Smart ad placement: skips headings, blockquotes, code blocks, figures
 * - Lazy-loads in-content ads via IntersectionObserver
 * - CLS-safe with reserved min-height containers
 * - Clear "Advertisement" label for AdSense compliance
 * - Per-post override via blog.adInterval prop
 * 
 * Props:
 * - html: raw HTML string of blog content
 * - settings: site settings (passed to AdRenderer)
 * - className: CSS classes for the content wrapper
 * - blog: optional blog object for per-post overrides
 */
export default function BlogContentWithAds({ html, settings, className = '', blog }) {
  const interval = getBlogAdInterval(settings, blog);

  const chunks = useMemo(() => {
    if (!html) return [];
    // Split on closing block-level tags to find natural content breaks
    const parts = html.split(/(<\/(?:p|h[2-6]|blockquote|ul|ol|div|figure|table|pre)>)/gi);
    
    // Rejoin into complete HTML blocks
    const blocks = [];
    let current = '';
    for (let i = 0; i < parts.length; i++) {
      current += parts[i];
      if (/^<\/(?:p|h[2-6]|blockquote|ul|ol|div|figure|table|pre)>$/i.test(parts[i])) {
        blocks.push(current);
        current = '';
      }
    }
    if (current.trim()) blocks.push(current);

    // Group blocks into chunks, inserting ad breaks at safe positions
    const grouped = [];
    let group = '';
    let paraCount = 0;
    for (const block of blocks) {
      group += block;
      // Only count substantial paragraph-like blocks
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

  if (!settings?.adsEnabled || chunks.length <= 1) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className={className}>
      {chunks.map((chunk, i) => (
        <div key={i}>
          <div dangerouslySetInnerHTML={{ __html: chunk }} />
          {i < chunks.length - 1 && (
            <LazyAdSlot settings={settings} />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * LazyAdSlot - Lazy-loads an in-content ad when it enters the viewport.
 * Reserves min-height to prevent CLS. Labeled for AdSense compliance.
 */
function LazyAdSlot({ settings }) {
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
      className="my-6 sm:my-8 flex justify-center"
      style={{ minHeight: '100px' }}
    >
      {visible ? (
        <div className="w-full max-w-3xl">
          <p className="text-[10px] text-gray-400 text-center mb-1 uppercase tracking-wider select-none">Advertisement</p>
          <AdRenderer position="content_middle" settings={settings} className="w-full" />
        </div>
      ) : (
        <div className="w-full max-w-3xl" aria-hidden="true" />
      )}
    </div>
  );
}

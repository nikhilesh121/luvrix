import { useMemo } from 'react';
import AdRenderer from './AdRenderer';

/**
 * BlogContentWithAds - Renders blog HTML content with ads injected between paragraphs
 * 
 * Splits the blog content HTML at paragraph boundaries and injects
 * AdRenderer (content_middle position) every N paragraphs.
 * 
 * Props:
 * - html: raw HTML string of blog content
 * - settings: site settings (passed to AdRenderer)
 * - className: CSS classes for the content wrapper
 * - adInterval: number of paragraphs between ads (default: 4)
 */
export default function BlogContentWithAds({ html, settings, className = '', adInterval = 4 }) {
  const chunks = useMemo(() => {
    if (!html) return [];
    // Split on closing </p>, </h2>, </h3>, </blockquote>, </ul>, </ol> tags
    // to find natural content breaks
    const parts = html.split(/(<\/(?:p|h[2-6]|blockquote|ul|ol|div|figure|table)>)/gi);
    
    // Rejoin into complete HTML blocks
    const blocks = [];
    let current = '';
    for (let i = 0; i < parts.length; i++) {
      current += parts[i];
      // If this part is a closing tag, it's a natural break point
      if (/^<\/(?:p|h[2-6]|blockquote|ul|ol|div|figure|table)>$/i.test(parts[i])) {
        blocks.push(current);
        current = '';
      }
    }
    if (current.trim()) blocks.push(current);

    // Group blocks into chunks of adInterval
    const grouped = [];
    let group = '';
    let blockCount = 0;
    for (const block of blocks) {
      group += block;
      // Only count substantial blocks (not empty whitespace)
      if (block.replace(/<[^>]*>/g, '').trim().length > 20) {
        blockCount++;
      }
      if (blockCount >= adInterval) {
        grouped.push(group);
        group = '';
        blockCount = 0;
      }
    }
    if (group.trim()) grouped.push(group);

    return grouped;
  }, [html, adInterval]);

  if (!settings?.adsEnabled || chunks.length <= 1) {
    // No ads or too little content — render normally
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
            <div className="my-8 flex justify-center">
              <AdRenderer position="content_middle" settings={settings} className="w-full max-w-3xl" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

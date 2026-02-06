import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * AdRenderer - Renders admin-controlled ad placements
 * 
 * Props:
 * - position: string (e.g., "header_top", "content_middle", "sidebar_right")
 * - settings: object (full settings from Layout context)
 * - className: optional extra CSS classes
 * 
 * Features:
 * - Device targeting (desktop/mobile)
 * - Page targeting (home, blog, manga, chapter, categories, user)
 * - Safe rendering with error boundaries
 * - Prevents duplicate AdSense calls
 * - Prevents layout shifts with min-height containers
 */

function getPageType(pathname) {
  if (pathname === '/' || pathname === '') return 'home';
  if (pathname.startsWith('/blog')) return 'blog';
  if (pathname.includes('/chapter') || pathname.match(/\/manga\/[^/]+\/chapter/)) return 'chapter';
  if (pathname.startsWith('/manga')) return 'manga';
  if (pathname.startsWith('/categories')) return 'categories';
  if (pathname.startsWith('/user')) return 'user';
  return 'other';
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function AdRenderer({ position, settings, className = '' }) {
  const containerRef = useRef(null);
  const renderedRef = useRef(false);
  const router = useRouter();
  const isMobile = useIsMobile();

  // Don't render if ads are disabled globally
  if (!settings?.adsEnabled) return null;

  const placements = settings?.adPlacements || [];
  
  // Find matching placements for this position
  const matchingAds = placements.filter((ad) => {
    if (!ad.enabled) return false;
    if (ad.position !== position) return false;

    // Device targeting
    if (ad.devices === 'desktop' && isMobile) return false;
    if (ad.devices === 'mobile' && !isMobile) return false;

    // Page targeting
    const pages = ad.pages || ['all'];
    if (!pages.includes('all')) {
      const currentPageType = getPageType(router.pathname);
      if (!pages.includes(currentPageType)) return false;
    }

    return true;
  });

  if (matchingAds.length === 0) return null;

  return (
    <div className={`ad-container ad-pos-${position} ${className}`} data-ad-position={position}>
      {matchingAds.map((ad) => (
        <SafeAdSlot key={ad.id} ad={ad} containerRef={containerRef} />
      ))}
    </div>
  );
}

function SafeAdSlot({ ad }) {
  const slotRef = useRef(null);
  const injectedRef = useRef(false);

  useEffect(() => {
    if (!slotRef.current || !ad.code || injectedRef.current) return;
    injectedRef.current = true;

    try {
      // Create a temporary container to parse the HTML
      const temp = document.createElement('div');
      temp.innerHTML = ad.code;

      // Extract and execute scripts separately
      const scripts = temp.querySelectorAll('script');
      const fragment = document.createDocumentFragment();

      // Add non-script content
      while (temp.firstChild) {
        if (temp.firstChild.nodeName !== 'SCRIPT') {
          fragment.appendChild(temp.firstChild);
        } else {
          temp.removeChild(temp.firstChild);
        }
      }
      slotRef.current.appendChild(fragment);

      // Execute scripts
      scripts.forEach((origScript) => {
        const newScript = document.createElement('script');
        if (origScript.src) {
          // Don't duplicate the global AdSense script
          if (origScript.src.includes('adsbygoogle') && document.querySelector(`script[src*="adsbygoogle"]`)) {
            return;
          }
          newScript.src = origScript.src;
          newScript.async = true;
        } else {
          newScript.textContent = origScript.textContent;
        }
        if (origScript.type) newScript.type = origScript.type;
        newScript.crossOrigin = origScript.crossOrigin || 'anonymous';
        slotRef.current.appendChild(newScript);
      });

      // Push adsbygoogle if ins element exists
      const insElements = slotRef.current.querySelectorAll('ins.adsbygoogle');
      if (insElements.length > 0 && typeof window !== 'undefined') {
        insElements.forEach(() => {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (e) {
            // Ignore duplicate push errors
          }
        });
      }
    } catch (err) {
      console.error('Ad rendering error:', err);
    }
  }, [ad.code]);

  return (
    <div
      ref={slotRef}
      className="ad-slot"
      data-ad-id={ad.id}
      data-ad-type={ad.type}
      style={{ minHeight: ad.type === 'banner' ? '50px' : undefined, overflow: 'hidden' }}
    />
  );
}

/**
 * AdSlotInline - For use inside content (e.g., between paragraphs)
 * Wraps AdRenderer with standard content-width styling
 */
export function AdSlotInline({ settings }) {
  return (
    <div className="my-6 flex justify-center">
      <AdRenderer position="content_middle" settings={settings} className="w-full max-w-3xl" />
    </div>
  );
}

import { useState } from "react";
import Image from "next/image";

const FALLBACK_IMAGE = "https://res.cloudinary.com/dsga2d0bv/image/upload/w_1200,h_630,c_pad,b_rgb:6366f1/Luvrix/Luvrix_favicon_yqovij.png";

export default function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = "",
  quality = 75,
  priority = false,
  ...props 
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Generate optimized URL for external images
  const getOptimizedUrl = (url, w, q) => {
    if (!url) return FALLBACK_IMAGE;
    
    // If it's already our proxy URL, return as-is
    if (url.includes("/api/image-proxy/")) return url;
    
    // If it's a relative URL, return as-is
    if (!url.startsWith("http")) return url;
    
    // Create proxy URL with optimization params
    return `/api/image-proxy/optimize/${url}?w=${w}&q=${q}`;
  };

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  const optimizedSrc = hasError ? FALLBACK_IMAGE : getOptimizedUrl(imgSrc, width, quality);

  return (
    <div className={`relative overflow-hidden ${className}`} {...props}>
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        onError={handleError}
        className="object-cover w-full h-full"
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo="
      />
      
      {/* Loading state */}
      {!hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Error state indicator (optional) */}
      {hasError && (
        <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
          Image unavailable
        </div>
      )}
    </div>
  );
}

// Hook for image validation
export const useImageValidator = () => {
  const validateImageUrl = async (url) => {
    try {
      const urlObj = new URL(url);
      
      // Check protocol
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return { valid: false, error: "Only HTTP/HTTPS URLs allowed" };
      }
      
      // Check if URL responds
      const response = await fetch(`/api/image-proxy/validate?url=${encodeURIComponent(url)}`, {
        method: "HEAD"
      });
      
      if (!response.ok) {
        return { valid: false, error: "Image URL not accessible" };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: "Invalid URL format" };
    }
  };
  
  return { validateImageUrl };
};

/**
 * Input Sanitization Library
 * Prevents XSS attacks by sanitizing user input
 * Uses DOMPurify for HTML sanitization
 */

import DOMPurify from 'isomorphic-dompurify';

// Default DOMPurify configuration
const DEFAULT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
    'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
    'width', 'height', 'style'
  ],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],
  ADD_TAGS: [],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

// Strict configuration - plain text only
const STRICT_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
};

// Blog content configuration - more permissive for rich content
const BLOG_CONFIG = {
  ...DEFAULT_CONFIG,
  ALLOWED_TAGS: [
    ...DEFAULT_CONFIG.ALLOWED_TAGS,
    'figure', 'figcaption', 'picture', 'source', 'video', 'audio',
    'mark', 'del', 'ins', 'sub', 'sup', 'hr'
  ],
};

/**
 * Sanitize HTML content
 * @param {string} dirty - Untrusted HTML string
 * @param {object} config - Optional DOMPurify configuration
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHTML(dirty, config = DEFAULT_CONFIG) {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize to plain text (strips all HTML)
 * @param {string} dirty - Untrusted string
 * @returns {string} Plain text string
 */
export function sanitizeText(dirty) {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(dirty, STRICT_CONFIG);
}

/**
 * Sanitize blog content (more permissive)
 * @param {string} dirty - Blog HTML content
 * @returns {string} Sanitized blog HTML
 */
export function sanitizeBlogContent(dirty) {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(dirty, BLOG_CONFIG);
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 * @param {string} url - URL string
 * @returns {string} Safe URL or empty string
 */
export function sanitizeURL(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous URL schemes
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const scheme of dangerousSchemes) {
    if (trimmed.startsWith(scheme)) {
      return '';
    }
  }
  
  // Allow http, https, mailto, tel, and relative URLs
  const safeSchemes = ['http://', 'https://', 'mailto:', 'tel:', '/', '#'];
  const isSafe = safeSchemes.some(scheme => trimmed.startsWith(scheme)) || 
                 !trimmed.includes(':');
  
  return isSafe ? url : '';
}

/**
 * Sanitize an object's string values recursively
 * @param {object} obj - Object with potentially unsafe values
 * @param {function} sanitizer - Sanitizer function to use
 * @returns {object} Object with sanitized values
 */
export function sanitizeObject(obj, sanitizer = sanitizeText) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sanitizer));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizer(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sanitizer);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize user input for database storage
 * @param {object} input - User input object
 * @param {array} htmlFields - Fields that should allow HTML
 * @returns {object} Sanitized input
 */
export function sanitizeUserInput(input, htmlFields = []) {
  if (!input || typeof input !== 'object') {
    return input;
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      if (htmlFields.includes(key)) {
        sanitized[key] = sanitizeHTML(value);
      } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
        sanitized[key] = sanitizeURL(value);
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeUserInput(value, htmlFields);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Escape HTML entities (for displaying user input in HTML)
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHTML(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, char => escapeMap[char]);
}

// Export configurations for custom use
export const configs = {
  DEFAULT: DEFAULT_CONFIG,
  STRICT: STRICT_CONFIG,
  BLOG: BLOG_CONFIG,
};

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeBlogContent,
  sanitizeURL,
  sanitizeObject,
  sanitizeUserInput,
  escapeHTML,
  configs,
};

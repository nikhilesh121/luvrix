// Google Analytics Helper Library
// Supports GA4 with G-XXXXXXXXXX measurement ID

let analyticsId = null;
let isInitialized = false;

// Initialize GA with the measurement ID
export const initGA = (measurementId) => {
  if (typeof window === "undefined" || !measurementId) return;
  
  // Don't re-initialize if already done with same ID
  if (isInitialized && analyticsId === measurementId) return;
  
  analyticsId = measurementId;
  
  // Check if gtag script already exists
  if (!document.querySelector("script[src*=\"googletagmanager.com/gtag/js\"]")) {
    // Load gtag.js script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }
  
  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    page_path: window.location.pathname,
    send_page_view: true,
  });
  
  isInitialized = true;
  console.log("Google Analytics initialized:", measurementId);
};

// Track page view
export const trackPageView = (url, title) => {
  if (typeof window === "undefined" || !window.gtag || !analyticsId) return;
  
  window.gtag("config", analyticsId, {
    page_path: url,
    page_title: title,
  });
};

// Track custom events
export const trackEvent = (action, category, label, value) => {
  if (typeof window === "undefined" || !window.gtag) return;
  
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track blog view
export const trackBlogView = (blogId, blogTitle, category, authorName) => {
  trackEvent("view_item", "blog", blogTitle, 1);
  trackEvent("blog_view", "content", blogTitle, 1);
  
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "view_item", {
      content_type: "blog",
      content_id: blogId,
      content_name: blogTitle,
      content_category: category,
      author: authorName,
    });
  }
};

// Track manga view
export const trackMangaView = (mangaId, mangaTitle, chapterCount) => {
  trackEvent("view_item", "manga", mangaTitle, 1);
  
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "view_item", {
      content_type: "manga",
      content_id: mangaId,
      content_name: mangaTitle,
      chapters: chapterCount,
    });
  }
};

// Track user engagement
export const trackEngagement = (type, contentId, contentTitle) => {
  const eventMap = {
    like: "like_content",
    comment: "add_comment",
    share: "share_content",
    follow: "follow_user",
    favorite: "add_to_favorites",
  };
  
  const eventName = eventMap[type] || type;
  trackEvent(eventName, "engagement", contentTitle, 1);
};

// Track search
export const trackSearch = (searchTerm, resultsCount) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "search", {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }
};

// Track user sign up/login
export const trackAuth = (method, isNewUser = false) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", isNewUser ? "sign_up" : "login", {
      method: method,
    });
  }
};

// Get current analytics ID
export const getAnalyticsId = () => analyticsId;

// Check if GA is initialized
export const isGAInitialized = () => isInitialized;

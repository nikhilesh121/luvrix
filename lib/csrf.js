/**
 * CSRF Protection Library
 * Sprint 2 - Critical Security Fix
 * 
 * Provides CSRF token generation and validation for forms and API routes.
 */

import crypto from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || "default-csrf-secret-change-in-production";
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Generate a CSRF token
 * @param {string} sessionId - User session identifier
 * @returns {string} CSRF token
 */
export function generateCSRFToken(sessionId = "") {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const data = `${sessionId}:${timestamp}:${randomBytes}`;
  
  const hmac = crypto.createHmac("sha256", CSRF_SECRET);
  hmac.update(data);
  const signature = hmac.digest("hex");
  
  // Token format: timestamp:randomBytes:signature
  const token = Buffer.from(`${timestamp}:${randomBytes}:${signature}`).toString("base64");
  return token;
}

/**
 * Validate a CSRF token
 * @param {string} token - CSRF token to validate
 * @param {string} sessionId - User session identifier
 * @returns {boolean} Whether the token is valid
 */
export function validateCSRFToken(token, sessionId = "") {
  if (!token) {
    return false;
  }

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [timestamp, randomBytes, signature] = decoded.split(":");
    
    if (!timestamp || !randomBytes || !signature) {
      return false;
    }

    // Check if token has expired
    const tokenTime = parseInt(timestamp, 10);
    if (Date.now() - tokenTime > TOKEN_EXPIRY) {
      return false;
    }

    // Verify signature
    const data = `${sessionId}:${timestamp}:${randomBytes}`;
    const hmac = crypto.createHmac("sha256", CSRF_SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest("hex");

    // Timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("CSRF validation error:", error);
    return false;
  }
}

/**
 * Middleware wrapper for CSRF protection on API routes
 * @param {Function} handler - API route handler
 * @param {Object} options - Configuration options
 * @returns {Function} Protected handler
 */
export function withCSRFProtection(handler, options = {}) {
  const { 
    methods = ["POST", "PUT", "DELETE", "PATCH"],
    tokenHeader = "x-csrf-token",
    tokenBody = "_csrf",
    skipRoutes = []
  } = options;

  return async (req, res) => {
    // Skip CSRF check for safe methods
    if (!methods.includes(req.method)) {
      return handler(req, res);
    }

    // Skip specific routes if configured
    if (skipRoutes.some(route => req.url?.includes(route))) {
      return handler(req, res);
    }

    // Get token from header or body
    const token = req.headers[tokenHeader] || req.body?.[tokenBody];
    
    // Get session ID (from cookie or auth)
    const sessionId = req.cookies?.sessionId || req.headers["x-session-id"] || "";

    if (!validateCSRFToken(token, sessionId)) {
      return res.status(403).json({ 
        error: "Invalid CSRF token",
        message: "Your session may have expired. Please refresh the page and try again."
      });
    }

    return handler(req, res);
  };
}

/**
 * API route to get a fresh CSRF token
 * Use this in your frontend to get tokens for forms
 */
export async function getCSRFTokenHandler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sessionId = req.cookies?.sessionId || req.headers["x-session-id"] || "";
  const token = generateCSRFToken(sessionId);

  // Set token in cookie as well for double-submit pattern
  res.setHeader("Set-Cookie", `csrf-token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`);
  
  return res.status(200).json({ token });
}

export default {
  generateCSRFToken,
  validateCSRFToken,
  withCSRFProtection,
  getCSRFTokenHandler
};

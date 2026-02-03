/**
 * CSRF Token API Endpoint
 * Sprint 2 - Critical Security Fix
 * 
 * GET /api/csrf-token - Returns a fresh CSRF token
 */

import { getCSRFTokenHandler } from '../../lib/csrf';

export default getCSRFTokenHandler;

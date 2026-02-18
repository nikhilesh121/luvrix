// API Handler wrapper with CORS support
// Use this to wrap all API route handlers

import { handleCors } from './cors';

export function withCors(handler) {
  return async (req, res) => {
    // Handle CORS preflight
    if (handleCors(req, res)) {
      return;
    }
    
    // Call the actual handler
    return handler(req, res);
  };
}

export default withCors;

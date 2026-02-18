// CORS Configuration for API routes
// Allows frontend on Hostinger to call backend API on this server

const ALLOWED_ORIGINS = [
  'https://luvrix.com',
  'https://www.luvrix.com',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.NEXT_PUBLIC_FRONTEND_URL,
].filter(Boolean);

export function setCorsHeaders(res, origin) {
  // Check if origin is allowed
  const isAllowed = !origin || ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.luvrix.com')
  );
  
  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function handleCors(req, res) {
  const origin = req.headers.origin;
  setCorsHeaders(res, origin);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  
  return false;
}

export default handleCors;

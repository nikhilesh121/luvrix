// Image URL validation API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ valid: false, error: 'URL parameter required' });
  }

  try {
    // Validate URL format
    const urlObj = new URL(decodeURIComponent(url));
    
    // Security checks
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return res.json({ valid: false, error: 'Only HTTP/HTTPS URLs allowed' });
    }
    
    // Block localhost/private IPs
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return res.json({ valid: false, error: 'Private/local URLs not allowed' });
    }

    // Test if URL is accessible
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Luvrix-ImageValidator/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.json({ 
        valid: false, 
        error: `Image not accessible (${response.status})` 
      });
    }

    // Check if it's actually an image
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return res.json({ 
        valid: false, 
        error: 'URL does not point to an image' 
      });
    }

    // Check file size (optional)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      return res.json({ 
        valid: false, 
        error: 'Image too large (max 10MB)' 
      });
    }

    return res.json({ 
      valid: true, 
      contentType,
      size: contentLength ? parseInt(contentLength) : null
    });

  } catch (error) {
    if (error.name === 'AbortError') {
      return res.json({ valid: false, error: 'Request timeout' });
    }
    
    return res.json({ 
      valid: false, 
      error: error.message || 'Invalid URL' 
    });
  }
}

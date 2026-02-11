// Image proxy API for optimizing external image URLs
// Usage: /api/image-proxy/optimize/https://external-image.com/image.jpg?w=800&q=75

import { withRateLimit } from "../../../lib/rateLimit";

async function handler(req, res) {
  const { params } = req.query;
  const [action, ...urlParts] = params;
  
  if (action !== "optimize") {
    return res.status(400).json({ error: "Invalid action" });
  }

  // Reconstruct the original URL
  const imageUrl = urlParts.join("/");
  const { w: _width, q: _quality, f: format } = req.query;

  try {
    // Validate URL
    const url = new URL(imageUrl);
    if (!url.protocol.startsWith("http")) {
      throw new Error("Invalid protocol");
    }

    // Set cache headers
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Type", format === "webp" ? "image/webp" : "image/jpeg");

    // Fetch external image
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Luvrix-ImageProxy/1.0"
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`External image failed: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      throw new Error("Not an image");
    }

    // For now, just proxy the image
    // TODO: Add image optimization with sharp
    const imageBuffer = await response.arrayBuffer();
    
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error("Image proxy error:", error.message);
    
    // Return fallback image
    res.setHeader("Content-Type", "image/svg+xml");
    return res.send(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial" font-size="16" text-anchor="middle" fill="#6b7280">
          Image not available
        </text>
      </svg>
    `);
  }
}

export default withRateLimit(handler, "content");

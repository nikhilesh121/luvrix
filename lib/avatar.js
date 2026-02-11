// Default avatar generator utility
// Generates a unique avatar URL based on user name/email

// Color palette for avatars
const AVATAR_COLORS = [
  ["#FF6B6B", "#FF8E8E"], // Red
  ["#4ECDC4", "#6EE7DE"], // Teal
  ["#45B7D1", "#67C9E0"], // Blue
  ["#96CEB4", "#B4E0CD"], // Green
  ["#FECA57", "#FFD97D"], // Yellow
  ["#FF9FF3", "#FFB8F8"], // Pink
  ["#54A0FF", "#7AB8FF"], // Light Blue
  ["#5F27CD", "#7D4AE8"], // Purple
  ["#00D2D3", "#33DDDD"], // Cyan
  ["#FF6348", "#FF8571"], // Orange
  ["#2ED573", "#5AE090"], // Emerald
  ["#FFA502", "#FFB733"], // Amber
];

// Get consistent color based on string hash
function getColorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// Get initials from name or email
export function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return "U";
}

// Generate SVG avatar as data URL
export function generateAvatarSVG(name, email, size = 200) {
  const initials = getInitials(name, email);
  const [color1, color2] = getColorFromString(name || email || "user");
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)"/>
      <text x="50%" y="50%" dy=".1em" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="600" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Get avatar URL - returns user's photo or generates default
export function getAvatarUrl(user) {
  if (!user) return generateAvatarSVG("", "", 200);
  
  // If user has a valid photo URL, use it
  if (user.photoURL && user.photoURL.trim() && user.photoURL !== "null" && user.photoURL !== "undefined") {
    return user.photoURL;
  }
  
  // Generate default avatar
  return generateAvatarSVG(user.name || user.displayName, user.email, 200);
}

// Export color getter for use in components
export function getAvatarColors(name, email) {
  return getColorFromString(name || email || "user");
}

export default {
  getInitials,
  generateAvatarSVG,
  getAvatarUrl,
  getAvatarColors,
};

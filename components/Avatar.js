import { useState } from "react";
import { getInitials, getAvatarColors } from "../lib/avatar";

export default function Avatar({ 
  user, 
  name, 
  email, 
  photoURL, 
  size = 40, 
  className = "",
  showFallback: _showFallback = true 
}) {
  const [imageError, setImageError] = useState(false);
  
  // Get user data from props or user object
  const displayName = name || user?.name || user?.displayName || "";
  const displayEmail = email || user?.email || "";
  const photo = photoURL || user?.photoURL;
  
  // Get initials and colors
  const initials = getInitials(displayName, displayEmail);
  const [color1, color2] = getAvatarColors(displayName, displayEmail);
  
  // Check if we should show the image
  const hasValidPhoto = photo && photo.trim() && photo !== "null" && photo !== "undefined" && !imageError;
  
  // Font size based on avatar size
  const fontSize = Math.round(size * 0.4);
  
  if (hasValidPhoto) {
    return (
      <div 
        className={`relative overflow-hidden rounded-full flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={photo}
          alt={displayName || "User"}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }
  
  // Show gradient fallback with initials
  return (
    <div
      className={`flex items-center justify-center rounded-full flex-shrink-0 text-white font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
        fontSize: `${fontSize}px`,
      }}
    >
      {initials}
    </div>
  );
}

// Smaller inline avatar for lists
export function AvatarSmall({ user, name, email, photoURL, className = "" }) {
  return (
    <Avatar 
      user={user} 
      name={name} 
      email={email} 
      photoURL={photoURL} 
      size={32} 
      className={className} 
    />
  );
}

// Large avatar for profile pages
export function AvatarLarge({ user, name, email, photoURL, className = "" }) {
  return (
    <Avatar 
      user={user} 
      name={name} 
      email={email} 
      photoURL={photoURL} 
      size={96} 
      className={className} 
    />
  );
}

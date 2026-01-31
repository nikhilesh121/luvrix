import { useState } from "react";
import { FiShare2, FiTwitter, FiFacebook, FiLinkedin, FiCopy, FiCheck } from "react-icons/fi";
import { FaWhatsapp, FaTelegram, FaReddit } from "react-icons/fa";
import { incrementBlogShares } from "../lib/api-client";

export default function SocialShare({ url, title, description, blogId }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || "");

  const shareLinks = [
    {
      name: "Twitter",
      icon: FiTwitter,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "hover:bg-blue-400 hover:text-white",
    },
    {
      name: "Facebook",
      icon: FiFacebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:bg-blue-600 hover:text-white",
    },
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:bg-green-500 hover:text-white",
    },
    {
      name: "Telegram",
      icon: FaTelegram,
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: "hover:bg-blue-500 hover:text-white",
    },
    {
      name: "LinkedIn",
      icon: FiLinkedin,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDesc}`,
      color: "hover:bg-blue-700 hover:text-white",
    },
    {
      name: "Reddit",
      icon: FaReddit,
      url: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      color: "hover:bg-orange-500 hover:text-white",
    },
  ];

  const handleShare = async (link) => {
    if (blogId) {
      try {
        await incrementBlogShares(blogId);
      } catch (error) {
        console.error("Error incrementing shares:", error);
      }
    }
    window.open(link.url, "_blank", "width=600,height=400");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (blogId) {
        await incrementBlogShares(blogId);
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying:", error);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-gray-600 flex items-center gap-1">
        <FiShare2 className="w-4 h-4" />
        Share:
      </span>
      {shareLinks.map((link) => (
        <button
          key={link.name}
          onClick={() => handleShare(link)}
          className={`p-2 rounded-full bg-gray-100 text-gray-600 transition ${link.color}`}
          title={`Share on ${link.name}`}
        >
          <link.icon className="w-5 h-5" />
        </button>
      ))}
      <button
        onClick={handleCopy}
        className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-700 hover:text-white transition"
        title="Copy link"
      >
        {copied ? <FiCheck className="w-5 h-5 text-green-500" /> : <FiCopy className="w-5 h-5" />}
      </button>
    </div>
  );
}

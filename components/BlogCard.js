import Link from "next/link";
import { motion } from "framer-motion";
import { FiClock, FiUser, FiArrowUpRight, FiBookmark } from "react-icons/fi";

const DEFAULT_IMAGE = "/default-blog.svg";

export default function BlogCard({ blog, index = 0 }) {
  // Get image URL from multiple possible fields
  const imageUrl = blog.thumbnail || blog.imageUrl || null;

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="group relative"
    >
      {/* Card Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
      
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500">
        <Link href={`/blog?id=${blog.id}`}>
          {/* Thumbnail */}
          <div className="h-52 bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={blog.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_IMAGE;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
                <span className="text-6xl font-bold text-white/20">{blog.title?.charAt(0) || "B"}</span>
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold rounded-full shadow-lg">
                {blog.category || "General"}
              </span>
            </div>

            {/* Bookmark Icon */}
            <motion.div 
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.1 }}
            >
              <div className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                <FiBookmark className="w-4 h-4 text-gray-700" />
              </div>
            </motion.div>

            {/* Read More Arrow */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                <FiArrowUpRight className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {blog.title}
            </h2>
            
            <p className="text-gray-500 text-sm mb-5 line-clamp-2 leading-relaxed">
              {blog.seoDescription || blog.content?.replace(/<[^>]*>/g, "").slice(0, 150)}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-100">
              <span className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <FiClock className="w-3 h-3" />
                </div>
                {formatDate(blog.createdAt)}
              </span>
              {blog.authorName && (
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <FiUser className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-medium text-gray-600">{blog.authorName}</span>
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </motion.article>
  );
}

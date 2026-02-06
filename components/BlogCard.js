import Link from "next/link";
import { motion } from "framer-motion";
import { FiClock, FiUser, FiArrowUpRight, FiEye, FiHeart } from "react-icons/fi";

const DEFAULT_IMAGE = "/default-blog.svg";

const categoryColors = {
  Technology: "from-blue-600 to-cyan-500",
  Finance: "from-emerald-600 to-teal-500",
  Sports: "from-orange-600 to-red-500",
  Entertainment: "from-purple-600 to-pink-500",
  Health: "from-green-600 to-lime-500",
  Education: "from-indigo-600 to-blue-500",
  Travel: "from-sky-600 to-blue-400",
  Food: "from-amber-600 to-yellow-500",
  Lifestyle: "from-rose-600 to-pink-400",
  News: "from-red-600 to-rose-500",
};

export default function BlogCard({ blog, index = 0, variant = "default" }) {
  const imageUrl = blog.thumbnail || blog.imageUrl || null;
  const catGrad = categoryColors[blog.category] || "from-primary to-secondary";

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Featured variant - first card in grid, larger
  if (variant === "featured") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        className="group col-span-1 md:col-span-2 lg:col-span-2"
      >
        <Link href={`/blog?id=${blog.id}`} className="block">
          <div className="relative h-full min-h-[320px] md:min-h-[400px] rounded-2xl overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt={blog.title} loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE; }}
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${catGrad}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 bg-gradient-to-r ${catGrad} text-white text-xs font-bold rounded-full`}>
                  {blog.category || "General"}
                </span>
                {blog.views > 0 && (
                  <span className="flex items-center gap-1 text-white/70 text-xs">
                    <FiEye className="w-3 h-3" /> {blog.views?.toLocaleString()}
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3 line-clamp-2 leading-tight group-hover:text-blue-200 transition-colors">
                {blog.title}
              </h2>
              <p className="text-white/70 text-sm mb-4 line-clamp-2 max-w-xl leading-relaxed hidden md:block">
                {blog.seoDescription || blog.content?.replace(/<[^>]*>/g, "").slice(0, 180)}
              </p>
              <div className="flex items-center gap-4 text-white/60 text-sm">
                {blog.authorName && (
                  <span className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {blog.authorName.charAt(0)}
                    </div>
                    <span className="font-medium text-white/80">{blog.authorName}</span>
                  </span>
                )}
                <span>{formatDate(blog.createdAt)}</span>
              </div>
            </div>
            <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-white/20">
              <FiArrowUpRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  // Default card variant
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group"
    >
      <Link href={`/blog?id=${blog.id}`} className="block h-full">
        <div className="h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/60 hover:border-gray-200 transition-all duration-300">
          {/* Thumbnail */}
          <div className="relative aspect-[16/10] overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt={blog.title} loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE; }}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${catGrad} flex items-center justify-center`}>
                <span className="text-5xl font-black text-white/20">{blog.title?.charAt(0) || "B"}</span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span className={`px-2.5 py-1 bg-gradient-to-r ${catGrad} text-white text-[11px] font-bold rounded-full shadow-sm`}>
                {blog.category || "General"}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content */}
          <div className="p-5">
            <h2 className="text-[15px] font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {blog.title}
            </h2>
            <p className="text-gray-500 text-[13px] mb-4 line-clamp-2 leading-relaxed">
              {blog.seoDescription || blog.content?.replace(/<[^>]*>/g, "").slice(0, 120)}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-3">
                <span>{formatDate(blog.createdAt)}</span>
                {blog.views > 0 && (
                  <span className="flex items-center gap-1"><FiEye className="w-3 h-3" />{blog.views?.toLocaleString()}</span>
                )}
              </div>
              {blog.authorName && (
                <span className="flex items-center gap-1.5 font-medium text-gray-500">
                  <div className={`w-5 h-5 bg-gradient-to-br ${catGrad} rounded-full flex items-center justify-center`}>
                    <span className="text-[9px] font-bold text-white">{blog.authorName.charAt(0)}</span>
                  </div>
                  {blog.authorName}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

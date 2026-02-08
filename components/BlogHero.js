import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";

/**
 * BlogHero — Mobile-first hero for the default blog template.
 *
 * Design rules:
 *  - Title (H1) is ALWAYS above the fold on every device.
 *  - Featured image is optional; layout adapts gracefully without it.
 *  - Touch-friendly spacing (min 44px tap targets).
 *  - All text is INSIDE the image container (no negative margins).
 *  - Author avatar, date, reading time, view count in one row that wraps.
 */
export default function BlogHero({ blog, author, readingTime, viewCount, formatDate }) {
  const hasImage = !!blog.thumbnail;

  return (
    <section className="relative">
      {/* --- WITH featured image --- */}
      {hasImage ? (
        <div className="relative w-full min-h-[360px] sm:min-h-[400px] md:min-h-[460px] lg:min-h-[520px] overflow-hidden bg-gray-900 flex flex-col justify-end">
          {/* Background image */}
          <img
            src={blog.thumbnail}
            alt={blog.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          {/* Gradient overlay — stronger at bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />

          {/* Text content — always at bottom of image, fully inside */}
          <div className="relative z-10 w-full">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 md:pb-10 pt-20 sm:pt-28">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 sm:mb-5 transition min-h-[44px] sm:min-h-0"
                >
                  <FiArrowLeft className="w-4 h-4" /> Home
                </Link>

                {blog.category && (
                  <Link
                    href={`/categories?cat=${blog.category.toLowerCase()}`}
                    className="block w-fit mb-3 sm:mb-4"
                  >
                    <span className="inline-block px-3 py-1 bg-primary/90 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                      {blog.category}
                    </span>
                  </Link>
                )}

                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-white leading-[1.15] mb-3 sm:mb-4 break-words">
                  {blog.title}
                </h1>

                <AuthorMeta
                  blog={blog}
                  author={author}
                  readingTime={readingTime}
                  viewCount={viewCount}
                  formatDate={formatDate}
                  light
                />
              </motion.div>
            </div>
          </div>
        </div>
      ) : (
        /* --- WITHOUT featured image --- */
        <div className="bg-gradient-to-br from-primary/5 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-8 md:pt-10 md:pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-primary text-sm mb-5 sm:mb-6 transition min-h-[44px] sm:min-h-0"
              >
                <FiArrowLeft className="w-4 h-4" /> Home
              </Link>

              {blog.category && (
                <Link
                  href={`/categories?cat=${blog.category.toLowerCase()}`}
                  className="block w-fit mb-3 sm:mb-4"
                >
                  <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wide">
                    {blog.category}
                  </span>
                </Link>
              )}

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-gray-900 dark:text-white leading-[1.15] mb-4 break-words">
                {blog.title}
              </h1>

              <AuthorMeta
                blog={blog}
                author={author}
                readingTime={readingTime}
                viewCount={viewCount}
                formatDate={formatDate}
              />
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Shared author / meta row — wraps nicely on mobile.
 */
function AuthorMeta({ blog, author, readingTime, viewCount, formatDate, light }) {
  const textClass = light ? "text-white/80" : "text-gray-500 dark:text-gray-400";
  const nameClass = light ? "text-white font-medium" : "text-gray-700 dark:text-gray-200 font-medium";
  const avatarBg = light ? "bg-white/25" : "bg-primary/15 dark:bg-primary/25";

  const stats = [
    blog.createdAt && formatDate(blog.createdAt),
    `${readingTime} min read`,
    viewCount > 0 && `${viewCount.toLocaleString()} views`,
  ].filter(Boolean);

  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-[11px] sm:text-sm ${textClass}`}>
      {author && (
        <Link
          href={`/user/${blog.authorId}`}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden shrink-0 ${avatarBg}`}>
            {author.photoURL ? (
              <img src={author.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                {author.name?.charAt(0)}
              </div>
            )}
          </div>
          <span className={nameClass}>{author.name}</span>
        </Link>
      )}
      {stats.length > 0 && (
        <span className="inline-flex items-center gap-0.5 sm:gap-1 flex-wrap">
          {stats.map((s, i) => (
            <span key={i} className="whitespace-nowrap">
              {i > 0 && <span className="mx-0.5 opacity-40">·</span>}
              {s}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

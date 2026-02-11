import { motion } from "framer-motion";
import Link from "next/link";
import { FiArrowLeft, FiPlay } from "react-icons/fi";
import { useState, useEffect } from "react";

export const BLOG_TEMPLATES = [
  { id: "default", name: "Classic", description: "Full-width hero with overlay text", preview: "bg-gradient-to-br from-slate-800 to-slate-900" },
  { id: "magazine", name: "Magazine", description: "Split layout with image offset", preview: "bg-gradient-to-br from-amber-800 to-rose-900" },
  { id: "minimal", name: "Minimal", description: "Clean, typography-focused", preview: "bg-gradient-to-br from-gray-100 to-white" },
  { id: "cinematic", name: "Cinematic", description: "Full-bleed dark hero header", preview: "bg-gradient-to-br from-gray-900 to-black" },
  { id: "newsletter", name: "Newsletter", description: "Centered boxed layout", preview: "bg-gradient-to-br from-blue-100 to-indigo-100" },
  { id: "bold", name: "Bold", description: "Large gradient title accent", preview: "bg-gradient-to-br from-purple-700 to-pink-600" },
  { id: "video", name: "Video", description: "YouTube, live streams & video embeds", preview: "bg-gradient-to-br from-red-600 to-orange-500" },
];

export function TemplateSelector({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">Blog Template <span className="text-gray-400 font-normal">(optional)</span></label>
      <div className="grid grid-cols-3 gap-3">
        {BLOG_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`relative rounded-xl border-2 p-3 text-left transition-all ${
              value === t.id
                ? "border-primary ring-2 ring-primary/20 shadow-lg"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`h-16 rounded-lg mb-2 ${t.preview} ${t.id === "minimal" ? "border border-gray-200" : ""}`} />
            <p className="text-sm font-semibold text-gray-800">{t.name}</p>
            <p className="text-xs text-gray-500 leading-tight">{t.description}</p>
            {value === t.id && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function AuthorMeta({ blog, author, readingTime, viewCount }) {
  const stats = [
    blog.createdAt && new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    readingTime,
    viewCount > 0 && `${viewCount.toLocaleString()} views`,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-[11px] sm:text-sm">
      {author && (
        <Link href={`/user/${blog.authorId}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/20 overflow-hidden shrink-0">
            {author.photoURL ? (
              <img src={author.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary font-bold text-[10px]">
                {(author.name || "?")[0]}
              </div>
            )}
          </div>
          <span className="font-medium">{author.name || author.displayName || "Author"}</span>
        </Link>
      )}
      {stats.length > 0 && (
        <span className="inline-flex items-center gap-0.5 sm:gap-1 flex-wrap">
          {stats.map((s, i) => (
            <span key={i} className="whitespace-nowrap">{i > 0 && <span className="mx-0.5 opacity-40">·</span>}{s}</span>
          ))}
        </span>
      )}
    </div>
  );
}

export function MagazineHero({ blog, author, readingTime, viewCount }) {
  return (
    <div className="relative bg-gradient-to-br from-amber-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary mb-8 transition text-sm">
              <FiArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            {blog.category && (
              <div className="mb-5">
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                  {blog.category}
                </span>
              </div>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight break-words">
              {blog.title}
            </h1>
            <div className="text-gray-600 dark:text-gray-400">
              <AuthorMeta blog={blog} author={author} readingTime={readingTime} viewCount={viewCount} />
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="h-1 w-24 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full mt-6 origin-left"
            />
          </motion.div>
          {/* Image side */}
          {blog.thumbnail && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                <img src={blog.thumbnail} alt={blog.title} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-3 -right-3 w-full h-full rounded-2xl border-2 border-amber-200 dark:border-amber-800/40 -z-10" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MinimalHero({ blog, author, readingTime, viewCount }) {
  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 pt-12 md:pt-20 pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-10 transition text-sm">
            <FiArrowLeft className="w-4 h-4" /> Home
          </Link>
          {blog.category && (
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-5">{blog.category}</p>
          )}
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-6 leading-snug break-words">
            {blog.title}
          </h1>
          <div className="flex items-center gap-6 text-gray-500 dark:text-gray-400 text-sm border-b border-gray-100 dark:border-gray-700 pb-8">
            <AuthorMeta blog={blog} author={author} readingTime={readingTime} viewCount={viewCount} />
          </div>
        </motion.div>
        {blog.thumbnail && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8"
          >
            <img src={blog.thumbnail} alt={blog.title} className="w-full rounded-xl shadow-sm" />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function CinematicHero({ blog, author, readingTime, viewCount }) {
  return (
    <div className="relative bg-black min-h-[70vh] flex items-end">
      {blog.thumbnail && (
        <img src={blog.thumbnail} alt={blog.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-12 md:pb-20 w-full">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-10 transition text-sm">
            <FiArrowLeft className="w-4 h-4" /> Back
          </Link>
          {blog.category && (
            <span className="inline-block px-3 py-1 border border-white/30 text-white/90 rounded text-xs font-semibold uppercase tracking-widest mb-6">
              {blog.category}
            </span>
          )}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-none tracking-tight break-words">
            {blog.title}
          </h1>
          <div className="text-white/70">
            <AuthorMeta blog={blog} author={author} readingTime={readingTime} viewCount={viewCount} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function NewsletterHero({ blog, author, readingTime, viewCount }) {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto px-4 pt-12 md:pt-20 pb-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-primary mb-8 transition text-sm">
            <FiArrowLeft className="w-4 h-4" /> Home
          </Link>
          {blog.category && (
            <div className="mb-6">
              <span className="inline-block px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                {blog.category}
              </span>
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-5 leading-tight break-words">
            {blog.title}
          </h1>
          <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
            <AuthorMeta blog={blog} author={author} readingTime={readingTime} viewCount={viewCount} />
          </div>
          <div className="h-px w-full bg-gray-200 dark:bg-gray-700 mt-8" />
        </motion.div>
        {blog.thumbnail && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-8">
            <img src={blog.thumbnail} alt={blog.title} className="w-full rounded-2xl shadow-lg" />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function BoldHero({ blog, author, readingTime, viewCount }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-500">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-10 transition text-sm">
            <FiArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          {blog.category && (
            <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              {blog.category}
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight break-words">
            {blog.title}
          </h1>
          <div className="text-white/80">
            <AuthorMeta blog={blog} author={author} readingTime={readingTime} viewCount={viewCount} />
          </div>
        </motion.div>
        {blog.thumbnail && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-10">
            <img src={blog.thumbnail} alt={blog.title} className="w-full rounded-2xl shadow-2xl" />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function MagazineContent({ children }) {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-rose-400 to-transparent rounded-full hidden md:block" />
        <div className="md:pl-8">
          {children}
        </div>
      </div>
    </article>
  );
}

export function MinimalContent({ children }) {
  return (
    <article className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      {children}
    </article>
  );
}

export function CinematicContent({ children }) {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 md:py-16">
      {children}
    </article>
  );
}

export function NewsletterContent({ children }) {
  return (
    <article className="max-w-2xl mx-auto px-4 py-10 md:py-14">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-10">
        {children}
      </div>
    </article>
  );
}

export function BoldContent({ children }) {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 md:py-16">
      {children}
    </article>
  );
}

// ============================================
// VIDEO TEMPLATE
// ============================================

function parseVideoUrl(url) {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (ytMatch) return { type: "youtube", id: ytMatch[1], embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0` };
  // YouTube Live
  const ytLiveMatch = url.match(/youtube\.com\/live\/([\w-]{11})/);
  if (ytLiveMatch) return { type: "youtube_live", id: ytLiveMatch[1], embedUrl: `https://www.youtube.com/embed/${ytLiveMatch[1]}?autoplay=1&rel=0` };
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: "vimeo", id: vimeoMatch[1], embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  // Dailymotion
  const dmMatch = url.match(/dailymotion\.com\/video\/([\w]+)/);
  if (dmMatch) return { type: "dailymotion", id: dmMatch[1], embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}` };
  // Twitch
  const twitchMatch = url.match(/twitch\.tv\/(\w+)/);
  if (twitchMatch) return { type: "twitch", id: twitchMatch[1], embedUrl: `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${typeof window !== "undefined" ? window.location.hostname : "luvrix.com"}` };
  // Direct video URL
  if (url.match(/\.(mp4|webm|ogg|m3u8)$/i)) return { type: "direct", url };
  // Generic embed (iframe-compatible URL)
  return { type: "embed", embedUrl: url };
}

function VideoPlayer({ videoUrl, isLive: _isLive }) {
  const video = parseVideoUrl(videoUrl);
  if (!video) return (
    <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center">
      <p className="text-gray-500">No video URL provided</p>
    </div>
  );

  if (video.type === "direct") {
    return (
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
        <video src={video.url} controls className="w-full h-full" playsInline />
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
      <iframe
        src={video.embedUrl}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title="Video player"
      />
    </div>
  );
}

function LiveBadge() {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold uppercase tracking-wider">
      <span className={`w-2 h-2 rounded-full bg-white ${pulse ? "opacity-100" : "opacity-40"} transition-opacity`} />
      LIVE
    </span>
  );
}

export function VideoHero({ blog, author, readingTime: _readingTime, viewCount }) {
  const isLive = blog.isLive || blog.videoUrl?.includes("/live/") || blog.videoUrl?.includes("twitch.tv");

  return (
    <div className="relative bg-gray-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-3xl" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-6 pb-10 md:pt-10 md:pb-16">
        {/* Navigation */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition text-sm">
            <FiArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </motion.div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <VideoPlayer videoUrl={blog.videoUrl} isLive={isLive} />
        </motion.div>

        {/* Meta info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {isLive && <LiveBadge />}
            {blog.category && (
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-xs font-semibold uppercase tracking-wider">
                {blog.category}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-semibold">
              <FiPlay className="w-3 h-3" /> Video
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-5 leading-tight break-words">
            {blog.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-gray-400 text-xs sm:text-sm">
            {author && (
              <Link href={`/user/${blog.authorId}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 overflow-hidden ring-2 ring-red-500/30 shrink-0">
                  {author.photoURL ? (
                    <img src={author.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-[10px]">
                      {(author.name || "?")[0]}
                    </div>
                  )}
                </div>
                <span className="font-medium">{author.name || author.displayName || "Author"}</span>
              </Link>
            )}
            <span className="inline-flex items-center gap-1 flex-wrap">
              {blog.createdAt && (
                <span className="whitespace-nowrap">{new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              )}
              {viewCount > 0 && (
                <span className="whitespace-nowrap"><span className="mx-0.5 opacity-40">·</span>{viewCount.toLocaleString()} views</span>
              )}
            </span>
          </div>
          {/* Gradient divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="h-0.5 w-full bg-gradient-to-r from-red-500 via-orange-500 to-transparent rounded-full mt-8 origin-left"
          />
        </motion.div>
      </div>
    </div>
  );
}

export function VideoContent({ children }) {
  return (
    <article className="max-w-4xl mx-auto px-4 py-8 md:py-14">
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-orange-500 to-transparent rounded-full hidden md:block" />
        <div className="md:pl-8">
          {children}
        </div>
      </div>
    </article>
  );
}

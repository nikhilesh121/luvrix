import { motion } from "framer-motion";
import Link from "next/link";
import { FiCalendar, FiClock, FiEye, FiUser, FiArrowLeft, FiTag } from "react-icons/fi";

export const BLOG_TEMPLATES = [
  { id: "default", name: "Classic", description: "Full-width hero with overlay text", preview: "bg-gradient-to-br from-slate-800 to-slate-900" },
  { id: "magazine", name: "Magazine", description: "Split layout with sidebar feel", preview: "bg-gradient-to-br from-amber-800 to-rose-900" },
  { id: "minimal", name: "Minimal", description: "Clean, typography-focused design", preview: "bg-gradient-to-br from-gray-100 to-white" },
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
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {author && (
        <Link href={`/user/${blog.authorId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden">
            {author.photoURL ? (
              <img src={author.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">
                {(author.name || "?")[0]}
              </div>
            )}
          </div>
          <span className="font-medium">{author.name || author.displayName || "Author"}</span>
        </Link>
      )}
      {blog.createdAt && (
        <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5" />{new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
      )}
      {readingTime && <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5" />{readingTime}</span>}
      {viewCount > 0 && <span className="flex items-center gap-1"><FiEye className="w-3.5 h-3.5" />{viewCount.toLocaleString()} views</span>}
    </div>
  );
}

export function MagazineHero({ blog, author, readingTime, viewCount }) {
  return (
    <div className="relative bg-gradient-to-br from-amber-50 via-white to-rose-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition text-sm">
              <FiArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            {blog.category && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                  {blog.category}
                </span>
              </div>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight break-words">
              {blog.title}
            </h1>
            <div className="text-gray-600">
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
              <div className="absolute -bottom-3 -right-3 w-full h-full rounded-2xl border-2 border-amber-200 -z-10" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MinimalHero({ blog, author, readingTime, viewCount }) {
  return (
    <div className="bg-white">
      <div className="max-w-2xl mx-auto px-4 pt-12 md:pt-20 pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-8 transition text-sm">
            <FiArrowLeft className="w-4 h-4" /> Home
          </Link>
          {blog.category && (
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">{blog.category}</p>
          )}
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-6 leading-snug break-words">
            {blog.title}
          </h1>
          <div className="flex items-center gap-6 text-gray-500 text-sm border-b border-gray-100 pb-8">
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

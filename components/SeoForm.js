import { useState, useEffect } from "react";
import { calculateSeoScore, getSeoStatus, MIN_SEO_SCORE } from "../utils/seoScore";
import { slugify } from "../utils/slugify";

export default function SeoForm({ blog, onChange, initialData }) {
  const [seoData, setSeoData] = useState({
    seoTitle: initialData?.seoTitle || blog?.seoTitle || "",
    seoDescription: initialData?.seoDescription || blog?.seoDescription || "",
    keywords: initialData?.keywords || blog?.keywords || "",
    slug: initialData?.slug || blog?.slug || "",
  });
  const [seoResult, setSeoResult] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Update seoData when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && !initialized) {
      setSeoData({
        seoTitle: initialData.seoTitle || "",
        seoDescription: initialData.seoDescription || "",
        keywords: initialData.keywords || "",
        slug: initialData.slug || "",
      });
      setInitialized(true);
    }
  }, [initialData, initialized]);

  useEffect(() => {
    const fullBlog = { ...blog, ...seoData };
    const result = calculateSeoScore(fullBlog);
    setSeoResult(result);
  }, [blog, seoData]);

  const handleChange = (field, value) => {
    const newData = { ...seoData, [field]: value };
    setSeoData(newData);
    onChange(newData);
  };

  const generateSlug = () => {
    if (blog?.title) {
      const slug = slugify(blog.title);
      handleChange("slug", slug);
    }
  };

  const status = seoResult ? getSeoStatus(seoResult.score) : null;

  return (
    <div className="bg-white dark:bg-transparent rounded-lg shadow dark:shadow-none p-6 dark:p-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SEO Settings</h3>
        {seoResult && (
          <div className="flex items-center gap-2">
            <div
              className={"w-3 h-3 rounded-full"}
              style={{ backgroundColor: status?.color }}
            />
            <span className="font-semibold text-gray-900 dark:text-gray-100">{seoResult.score}/100</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{status?.message}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* SEO Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            SEO Title
          </label>
          <input
            type="text"
            value={seoData.seoTitle}
            onChange={(e) => handleChange("seoTitle", e.target.value)}
            placeholder="Enter SEO title (50+ characters recommended)"
            className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {seoData.seoTitle.length} characters
          </p>
        </div>

        {/* SEO Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            SEO Description
          </label>
          <textarea
            value={seoData.seoDescription}
            onChange={(e) => handleChange("seoDescription", e.target.value)}
            placeholder="Enter meta description (150+ characters recommended)"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {seoData.seoDescription.length} characters
          </p>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Keywords (comma separated)
          </label>
          <input
            type="text"
            value={seoData.keywords}
            onChange={(e) => handleChange("keywords", e.target.value)}
            placeholder="keyword1, keyword2, keyword3, keyword4, keyword5"
            className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {seoData.keywords.split(",").filter((k) => k.trim()).length} keywords
          </p>
        </div>

        {/* URL Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            URL Slug
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={seoData.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              placeholder="url-friendly-slug"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={generateSlug}
              className="px-4 py-2 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition whitespace-nowrap"
            >
              Generate
            </button>
          </div>
        </div>

        {/* SEO Checklist */}
        {seoResult && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
            <h4 className="font-medium mb-3 text-gray-900 dark:text-white">SEO Checklist</h4>
            <ul className="space-y-2">
              {seoResult.details.map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
                      item.passed ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {item.passed ? "✓" : "✗"}
                  </span>
                  <span className={item.passed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                    {item.item}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">({item.points} pts)</span>
                </li>
              ))}
            </ul>

            {seoResult.score < MIN_SEO_SCORE && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                ⚠️ SEO score must be at least {MIN_SEO_SCORE} to publish
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

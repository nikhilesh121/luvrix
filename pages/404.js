import Link from "next/link";
import Layout from "../components/Layout";
import { FiHome, FiSearch, FiBookOpen, FiEdit3, FiArrowRight } from "react-icons/fi";

export default function Custom404() {
  return (
    <Layout title="Page Not Found" description="The page you're looking for doesn't exist or has been removed." noindex={true}>
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Animated 404 */}
          <div className="relative mb-8">
            <h1 className="text-[120px] sm:text-[160px] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 blur-3xl -z-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            The page you&apos;re looking for doesn&apos;t exist, has been moved, or was removed.
          </p>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <Link href="/" className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all">
              <FiHome className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Home</span>
            </Link>
            <Link href="/manga/" className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all">
              <FiBookOpen className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-medium">Manga</span>
            </Link>
            <Link href="/categories/" className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all">
              <FiSearch className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">Categories</span>
            </Link>
            <Link href="/giveaway/" className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all">
              <FiEdit3 className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium">Giveaways</span>
            </Link>
          </div>

          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition">
            Go to Homepage <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Layout>
  );
}

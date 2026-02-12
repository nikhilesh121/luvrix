import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { FiUsers, FiTarget, FiHeart, FiAward, FiZap, FiGlobe, FiEdit3, FiBook, FiTrendingUp, FiStar } from "react-icons/fi";
import Head from "next/head";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

function formatNumber(num) {
  if (!num || num < 0) return "0";
  if (num < 1000) return `${num}`;
  if (num < 1000000) return `${Math.floor(num / 1000)}K+`;
  return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
}

export default function About() {
  const [platformStats, setPlatformStats] = useState({ readers: 0, writers: 0, articles: 0, categories: 0 });

  useEffect(() => {
    fetch("/api/stats/platform")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPlatformStats(data); })
      .catch(() => {});
  }, []);

  const features = [
    {
      icon: FiTarget,
      title: "Our Mission",
      description: "To provide a platform where creators can share their stories, knowledge, and passions with readers worldwide.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: FiUsers,
      title: "Community First",
      description: "We believe in building a strong community of writers and readers who support and inspire each other.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: FiHeart,
      title: "Quality Content",
      description: "We're committed to delivering high-quality blogs, manga, and articles across various categories.",
      color: "from-rose-500 to-orange-500"
    },
    {
      icon: FiAward,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from content curation to user experience.",
      color: "from-emerald-500 to-teal-500"
    }
  ];

  const stats = [
    { value: formatNumber(platformStats.readers), label: "Active Readers", icon: FiUsers },
    { value: formatNumber(platformStats.writers), label: "Writers", icon: FiEdit3 },
    { value: formatNumber(platformStats.articles), label: "Articles", icon: FiBook },
    { value: formatNumber(platformStats.categories), label: "Categories", icon: FiGlobe }
  ];

  return (
    <Layout title="About Us" description="Learn about Luvrix - the free platform for reading blogs, manga & stories. Join thousands of creators and readers sharing content worldwide." canonical={`${SITE_URL}/about/`}>
      <Head>
        <meta name="keywords" content="about luvrix, free blog platform, manga reader, content creators" />
      </Head>

      {/* Hero Section */}
      <div className="relative bg-[#0a0a0f] overflow-hidden">
        <div className="absolute inset-0">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-[120px]"
          />
          <motion.div 
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-full blur-[120px]"
          />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm mb-6 border border-white/10">
              <FiZap className="w-4 h-4 text-purple-400" />
              Welcome to Luvrix
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Where Stories Come
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Alive
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Your ultimate destination for discovering amazing stories, insightful blogs, and captivating manga content from creators worldwide.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  <FiEdit3 className="w-5 h-5" />
                  Start Writing
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold text-lg border border-white/10 hover:bg-white/20 transition-all"
                >
                  <FiBook className="w-5 h-5" />
                  Explore Content
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-8 border border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-3xl font-black text-slate-800">{stat.value}</p>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Features Grid */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">What We Stand For</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Our core values that drive everything we do</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl transition-shadow group"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-20 w-40 h-40 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 border-2 border-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 border-2 border-white rounded-full"></div>
          </div>
          
          <div className="relative z-10 p-10 md:p-16">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm mb-6">
                <FiStar className="w-4 h-4" />
                Our Journey
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black text-white mb-8">Our Story</h2>
              
              <div className="space-y-6 text-white/90 text-lg leading-relaxed">
                <p>
                  Luvrix was founded with a simple yet powerful vision: to create a space where 
                  creativity knows no bounds. We understand the power of storytelling and how it 
                  connects people across cultures and backgrounds.
                </p>
                <p>
                  Whether you're a passionate blogger, an avid manga reader, or someone who loves 
                  exploring diverse content, Luvrix has something for everyone. Our platform brings 
                  together writers, artists, and readers in a vibrant community.
                </p>
                <p>
                  Join us on this exciting journey as we continue to grow and evolve, always keeping 
                  our community at the heart of everything we do.
                </p>
              </div>
              
              <div className="mt-10">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 font-bold rounded-xl hover:shadow-lg transition-all"
                >
                  Join Our Community <FiTrendingUp className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

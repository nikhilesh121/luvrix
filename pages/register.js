import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiLock, FiAlertCircle, FiCheck, FiZap, FiArrowRight, FiGift, FiTrendingUp, FiAward } from "react-icons/fi";

function formatNumber(num) {
  if (!num || num < 0) return "0";
  if (num < 1000) return `${num}`;
  if (num < 1000000) return `${Math.floor(num / 1000)}K+`;
  return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
}

export default function Register() {
  const router = useRouter();
  const { register: registerUser, isLoggedIn, userData, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Static stats for display (no API call needed for static export)
  const platformStats = { readers: 50000, writers: 1200, articles: 3500 };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!authLoading && isLoggedIn && userData) {
      if (userData?.role === "ADMIN") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/profile");
      }
    }
  }, [authLoading, isLoggedIn, userData, router]);

  if (authLoading) {
    return (
      <Layout title="Register" noindex={true}>
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    const result = await registerUser(data.email, data.password, { name: data.name });

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Layout title="Register" noindex={true}>
      <div className="min-h-screen flex relative overflow-hidden">
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#0a0a0f]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                <FiZap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">Join Luvrix</h2>
              <p className="text-gray-400">Create your free account</p>
            </div>

            {/* Form Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <div className="hidden lg:block mb-6">
                <h1 className="text-3xl font-black text-white mb-2">Create Account</h1>
                <p className="text-gray-400">Start your creative journey today</p>
              </div>

              {/* Benefits Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                  <FiGift className="w-3.5 h-3.5" /> 1 Free Post
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                  <FiTrendingUp className="w-3.5 h-3.5" /> SEO Tools
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                  <FiAward className="w-3.5 h-3.5" /> Leaderboard
                </span>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <FiAlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-sm text-red-400">{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FiUser className="w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      {...register("name", {
                        required: "Name is required",
                        minLength: {
                          value: 2,
                          message: "Name must be at least 2 characters",
                        },
                      })}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 outline-none text-white placeholder-gray-500"
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1.5">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FiMail className="w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                    <input
                      type="email"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 outline-none text-white placeholder-gray-500"
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1.5">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <FiLock className="w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <input
                        type="password"
                        {...register("password", {
                          required: "Password is required",
                          minLength: {
                            value: 6,
                            message: "Min 6 characters",
                          },
                        })}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 outline-none text-white placeholder-gray-500"
                        placeholder="••••••"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Confirm</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <FiCheck className="w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <input
                        type="password"
                        {...register("confirmPassword", {
                          required: "Confirm password",
                          validate: (value) =>
                            value === password || "Passwords don't match",
                        })}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 outline-none text-white placeholder-gray-500"
                        placeholder="••••••"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <FiArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-purple-400 font-semibold hover:text-pink-400 transition-colors">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
            
            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                ← Back to Home
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0f] items-center justify-center p-12">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-[100px]"
            />
            <motion.div 
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-r from-cyan-600/30 to-blue-600/30 rounded-full blur-[100px]"
            />
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }} />
          </div>
          
          <div className="relative z-10 max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <FiZap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Luvrix</h2>
                  <p className="text-gray-500 text-sm">Stories & Knowledge</p>
                </div>
              </div>
              
              <h1 className="text-4xl font-black text-white mb-4 leading-tight">
                Start your
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  creative journey
                </span>
              </h1>
              
              <p className="text-gray-400 text-lg mb-10">
                Join thousands of writers sharing stories and inspiring millions around the world.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 text-center">
                  <p className="text-2xl font-black text-white">{formatNumber(platformStats.readers)}</p>
                  <p className="text-gray-500 text-xs">Readers</p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 text-center">
                  <p className="text-2xl font-black text-white">{formatNumber(platformStats.writers)}</p>
                  <p className="text-gray-500 text-xs">Writers</p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 text-center">
                  <p className="text-2xl font-black text-white">{formatNumber(platformStats.articles)}</p>
                  <p className="text-gray-500 text-xs">Articles</p>
                </div>
              </div>
              
              {/* Testimonial */}
              <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <p className="text-gray-300 mb-4 italic">"Luvrix helped me reach 10,000 readers in just 2 months. The SEO tools are amazing!"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <div>
                    <p className="text-white font-medium text-sm">Sarah Johnson</p>
                    <p className="text-gray-500 text-xs">Tech Blogger</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

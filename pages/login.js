import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiLock, FiAlertCircle, FiArrowRight, FiZap, FiEdit3, FiBook, FiStar, FiKey, FiCheck, FiArrowLeft } from "react-icons/fi";

export default function Login() {
  const router = useRouter();
  const { login, isLoggedIn, userData, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    try {
      const res = await fetch('/api/auth/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setResetStep(2);
        setResetSuccess("OTP sent to your email");
      } else {
        setResetError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setResetError("Something went wrong");
    }
    setResetLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetError("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }
    setResetLoading(true);
    setResetError("");
    try {
      const res = await fetch('/api/auth/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setResetSuccess("Password reset successfully! You can now login.");
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetStep(1);
          setResetEmail("");
          setResetOtp("");
          setNewPassword("");
          setConfirmPassword("");
          setResetSuccess("");
        }, 2000);
      } else {
        setResetError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setResetError("Something went wrong");
    }
    setResetLoading(false);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

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
      <Layout title="Login">
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    const result = await login(data.email, data.password);

    if (result.success) {
      if (result.user?.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    } else {
      setError(result.error || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <Layout title="Login">
      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => { setShowForgotPassword(false); setResetStep(1); setResetError(""); setResetSuccess(""); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#12121a] rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => { setShowForgotPassword(false); setResetStep(1); setResetError(""); setResetSuccess(""); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-white">Reset Password</h2>
                  <p className="text-sm text-gray-400">
                    {resetStep === 1 && "Enter your email to receive OTP"}
                    {resetStep === 2 && "Enter the OTP sent to your email"}
                  </p>
                </div>
              </div>

              {resetError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span className="text-sm text-red-400">{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                  <FiCheck className="w-5 h-5 text-green-400 shrink-0" />
                  <span className="text-sm text-green-400">{resetSuccess}</span>
                </div>
              )}

              {resetStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Send OTP<FiArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>
              )}

              {resetStep === 2 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">OTP Code</label>
                    <div className="relative">
                      <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        required
                        maxLength={6}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-center text-xl tracking-widest"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        minLength={6}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Reset Password<FiCheck className="w-5 h-5" /></>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setResetStep(1); setResetError(""); }}
                    className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    ← Back to email
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen flex relative overflow-hidden">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0f] items-center justify-center p-12">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-[100px]"
            />
            <motion.div 
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-full blur-[100px]"
            />
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
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
                Welcome back to
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  your creative space
                </span>
              </h1>
              
              <p className="text-gray-400 text-lg mb-10">
                Continue your journey of sharing stories and inspiring millions around the world.
              </p>
              
              {/* Feature Cards */}
              <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <FiEdit3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Write & Share</h3>
                    <p className="text-gray-500 text-sm">Publish unlimited stories</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <FiBook className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Read Manga</h3>
                    <p className="text-gray-500 text-sm">Access exclusive content</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <FiStar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Earn Recognition</h3>
                    <p className="text-gray-500 text-sm">Get featured & grow your audience</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Login Form */}
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
              <h2 className="text-2xl font-black text-white">Welcome Back</h2>
              <p className="text-gray-400">Sign in to continue</p>
            </div>

            {/* Form Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <div className="hidden lg:block mb-8">
                <h1 className="text-3xl font-black text-white mb-2">Sign In</h1>
                <p className="text-gray-400">Enter your credentials to continue</p>
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

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                          message: "Password must be at least 6 characters",
                        },
                      })}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 outline-none text-white placeholder-gray-500"
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1.5">{errors.password.message}</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <FiArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <button 
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-purple-400 hover:text-pink-400 text-sm font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-gray-400">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-purple-400 font-semibold hover:text-pink-400 transition-colors">
                    Create Account
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
      </div>
    </Layout>
  );
}

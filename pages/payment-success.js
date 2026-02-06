import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { getUser, updatePayment, addExtraPosts } from "../lib/api-client";


import { motion } from "framer-motion";
import { FiCheck, FiArrowRight, FiGift } from "react-icons/fi";
import Link from "next/link";

export default function PaymentSuccess() {
  const router = useRouter();
  const { txnid, posts } = router.query;
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // Wait for auth state to be determined
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function processPayment() {
      if (!txnid || !posts || !authChecked || processed) return;

      const user = auth.currentUser;
      
      // If no user after auth is checked, show error
      if (!user) {
        setError("Please login to continue");
        setProcessing(false);
        return;
      }

      // Mark as processed to prevent double processing
      setProcessed(true);

      try {
        // Update payment status
        await updatePayment(txnid, { status: "success" });

        // Add posts to user account
        const postsCount = parseInt(posts);
        await addExtraPosts(user.uid, postsCount);

        setSuccess(true);
      } catch (err) {
        console.error("Error processing payment:", err);
        // Check if it's a "already processed" error or real error
        if (err.message?.includes("already") || err.message?.includes("processed")) {
          setSuccess(true); // Payment was already processed
        } else {
          setError("Failed to process payment. Please contact support with Transaction ID: " + txnid);
        }
      } finally {
        setProcessing(false);
      }
    }

    if (txnid && posts && authChecked) {
      processPayment();
    }
  }, [txnid, posts, authChecked, processed]);

  return (
    <Layout title="Payment Successful" noindex={true}>
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-white to-pink-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          {processing ? (
            <div className="bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-100">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-spin opacity-20"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Processing Payment</h2>
              <p className="text-slate-500">Please wait while we confirm your transaction...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-3xl shadow-2xl p-10 text-center border border-red-100">
              <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-red-400/20 rounded-full animate-ping"></div>
                <span className="text-5xl relative z-10">❌</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-3">Payment Error</h1>
              <p className="text-red-600 mb-6 bg-red-50 px-4 py-3 rounded-xl text-sm">{error}</p>
              <Link href="/create-blog" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all">
                Try Again <FiArrowRight />
              </Link>
            </div>
          ) : success ? (
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-green-100">
              {/* Celebration Header */}
              <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-8 py-10 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 left-10 text-4xl animate-bounce">🎉</div>
                  <div className="absolute top-8 right-16 text-3xl animate-bounce delay-100">✨</div>
                  <div className="absolute bottom-4 left-1/4 text-2xl animate-bounce delay-200">🎊</div>
                  <div className="absolute bottom-6 right-10 text-3xl animate-bounce delay-300">💫</div>
                </div>
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <FiCheck className="w-10 h-10 text-white" />
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
                </div>
                <h1 className="text-3xl font-black text-white mb-1">Payment Successful!</h1>
                <p className="text-white/80">Thank you for your purchase</p>
              </div>
              
              {/* Content */}
              <div className="p-8 text-center">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 rounded-2xl border border-emerald-200 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <FiGift className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-emerald-600 font-medium">Added to your account</p>
                    <p className="text-2xl font-black text-emerald-700">{posts} Blog Post{parseInt(posts) > 1 ? "s" : ""}</p>
                  </div>
                </div>
                
                <p className="text-slate-500 text-sm mb-6">
                  Transaction ID: <code className="bg-slate-100 px-2 py-1 rounded text-xs">{txnid}</code>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/create-blog" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all">
                    Create Blog Now <FiArrowRight />
                  </Link>
                  <Link href="/profile" className="inline-flex items-center justify-center px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all">
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </Layout>
  );
}

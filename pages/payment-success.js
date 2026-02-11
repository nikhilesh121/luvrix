import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { FiCheck, FiArrowRight, FiGift, FiHeart } from "react-icons/fi";
import Link from "next/link";

export default function PaymentSuccess() {
  const router = useRouter();
  const { txnId } = router.query;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!txnId) return;
    const token = localStorage.getItem("luvrix_auth_token");
    fetch(`/api/payments/${txnId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPayment(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [txnId]);

  const isGiveawaySupport = payment?.giveawayId;

  return (
    <Layout title="Payment Successful" noindex={true}>
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#0a0a12]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          {loading ? (
            <div className="bg-[#12121a] rounded-3xl shadow-2xl p-10 text-center border border-white/5">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-spin opacity-20"></div>
                <div className="absolute inset-2 bg-[#12121a] rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verifying Payment</h2>
              <p className="text-gray-400">Please wait while we confirm your transaction...</p>
            </div>
          ) : (
            <div className="bg-[#12121a] rounded-3xl shadow-2xl overflow-hidden border border-green-500/10">
              {/* Celebration Header */}
              <div className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 px-8 py-10 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 left-10 text-4xl animate-bounce">🎉</div>
                  <div className="absolute top-8 right-16 text-3xl animate-bounce" style={{ animationDelay: "0.1s" }}>✨</div>
                  <div className="absolute bottom-4 left-1/4 text-2xl animate-bounce" style={{ animationDelay: "0.2s" }}>🎊</div>
                  <div className="absolute bottom-6 right-10 text-3xl animate-bounce" style={{ animationDelay: "0.3s" }}>💫</div>
                </div>
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <FiCheck className="w-10 h-10 text-white" />
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
                </div>
                <h1 className="text-3xl font-black text-white mb-1">Payment Successful!</h1>
                <p className="text-white/80">{isGiveawaySupport ? "Thank you for your generous support!" : "Thank you for your purchase"}</p>
              </div>
              
              {/* Content */}
              <div className="p-8 text-center">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-6 py-4 rounded-2xl border border-emerald-500/20 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    {isGiveawaySupport ? <FiHeart className="w-6 h-6 text-white" /> : <FiGift className="w-6 h-6 text-white" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-emerald-400 font-medium">
                      {isGiveawaySupport ? "Giveaway Support" : "Added to your account"}
                    </p>
                    <p className="text-2xl font-black text-white">
                      {isGiveawaySupport
                        ? `₹${payment?.amount || 0}`
                        : `${payment?.posts || 0} Blog Post${(payment?.posts || 0) > 1 ? "s" : ""}`
                      }
                    </p>
                  </div>
                </div>
                
                {payment?.productInfo && (
                  <p className="text-gray-400 text-sm mb-4">{payment.productInfo}</p>
                )}

                <p className="text-gray-500 text-sm mb-6">
                  Transaction ID: <code className="bg-white/5 px-2 py-1 rounded text-xs text-gray-400">{txnId}</code>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {isGiveawaySupport ? (
                    <button onClick={() => router.back()} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all">
                      Back to Giveaway <FiArrowRight />
                    </button>
                  ) : (
                    <Link href="/create-blog" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all">
                      Create Blog Now <FiArrowRight />
                    </Link>
                  )}
                  <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all">
                    Go Home
                  </Link>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiShoppingCart, FiCreditCard } from "react-icons/fi";
import { getSettings, createPayment, addExtraPosts } from "../lib/api-client";

import crypto from "crypto-js";

const POST_PACKAGES = [
  { posts: 1, label: "1 Post", discount: 0 },
  { posts: 2, label: "2 Posts", discount: 0 },
  { posts: 5, label: "5 Posts", discount: 5 },
  { posts: 10, label: "10 Posts", discount: 10 },
  { posts: 20, label: "20 Posts", discount: 15 },
  { posts: 50, label: "50 Posts", discount: 20 },
  { posts: 100, label: "100 Posts", discount: 25 },
];

export default function BuyPostsModal({ isOpen, onClose, onSuccess, userData }) {
  const [settings, setSettings] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      getSettings().then(setSettings);
    }
  }, [isOpen]);

  const pricePerPost = settings?.blogPostPrice || 49;

  const calculatePrice = (pkg) => {
    const basePrice = pkg.posts * pricePerPost;
    const discount = (basePrice * pkg.discount) / 100;
    return Math.round(basePrice - discount);
  };

  const generateTxnId = () => {
    return `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  const generateHash = (params, salt) => {
    const hashString = `${params.key}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|||||||||||${salt}`;
    return crypto.SHA512(hashString).toString();
  };

  const handlePayment = async () => {
    if (!selectedPackage) {
      setError("Please select a package");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Please login to continue");
        setLoading(false);
        return;
      }

      const amount = calculatePrice(selectedPackage);
      const txnId = generateTxnId();

      // PayU Parameters
      const payuParams = {
        key: settings?.payuMerchantKey || "r5wyW4",
        txnid: txnId,
        amount: amount.toString(),
        productinfo: `${selectedPackage.posts} Blog Posts`,
        firstname: userData?.name || user.displayName || "User",
        email: user.email,
        phone: userData?.phone || "9999999999",
        surl: `${window.location.origin}/payment-success?txnid=${txnId}&posts=${selectedPackage.posts}`,
        furl: `${window.location.origin}/payment-failed?txnid=${txnId}`,
      };

      // Generate hash
      const salt = settings?.payuMerchantSalt || "XsJMT8oE5cCjrQFzclX5E7JY9EJ4Q1S9";
      const hash = generateHash(payuParams, salt);

      // Create pending payment record
      await createPayment({
        userId: user.uid,
        txnId,
        amount,
        posts: selectedPackage.posts,
        status: "pending",
        packageLabel: selectedPackage.label,
      });

      // Create PayU form and submit
      const payuUrl = settings?.payuTestMode !== false
        ? "https://test.payu.in/_payment"
        : "https://secure.payu.in/_payment";

      const form = document.createElement("form");
      form.method = "POST";
      form.action = payuUrl;

      const params = { ...payuParams, hash };
      Object.keys(params).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment initialization failed. Please try again.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Buy Blog Posts</h2>
              <p className="text-gray-600 mt-1">Select a package to continue writing</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Price Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                <strong>Base Price:</strong> ₹{pricePerPost} per post
              </p>
              <p className="text-blue-600 text-sm mt-1">
                Bulk discounts available on larger packages!
              </p>
            </div>

            {/* Packages */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {POST_PACKAGES.map((pkg) => {
                const price = calculatePrice(pkg);
                const isSelected = selectedPackage?.posts === pkg.posts;
                return (
                  <button
                    key={pkg.posts}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800">{pkg.label}</span>
                      {isSelected && <FiCheck className="text-primary" />}
                    </div>
                    <div className="text-2xl font-bold text-primary">₹{price}</div>
                    {pkg.discount > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        Save {pkg.discount}%
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      ₹{Math.round(price / pkg.posts)} per post
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Package Summary */}
            {selectedPackage && (
              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      <FiShoppingCart className="inline mr-2" />
                      {selectedPackage.label}
                    </p>
                    {selectedPackage.discount > 0 && (
                      <p className="text-sm text-green-600">
                        {selectedPackage.discount}% discount applied
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ₹{calculatePrice(selectedPackage)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={!selectedPackage || loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiCreditCard className="w-5 h-5" />
                  Pay with PayU
                </>
              )}
            </button>

            {/* Security Note */}
            <p className="text-center text-sm text-gray-500 mt-4">
              🔒 Secure payment powered by PayU
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

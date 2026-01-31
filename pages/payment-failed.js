import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { updatePayment } from "../lib/api-client";
import { motion } from "framer-motion";
import { FiX, FiArrowRight, FiRefreshCw } from "react-icons/fi";
import Link from "next/link";

export default function PaymentFailed() {
  const router = useRouter();
  const { txnid } = router.query;

  useEffect(() => {
    async function updatePaymentStatus() {
      if (!txnid) return;

      try {
        await updatePayment(txnid, { status: "failed" });
      } catch (err) {
        console.error("Error updating payment status:", err);
      }
    }

    if (txnid) {
      updatePaymentStatus();
    }
  }, [txnid]);

  return (
    <Layout title="Payment Failed">
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiX className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            Your payment could not be processed. No amount has been deducted from your account.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-500">
              If your amount was deducted, please contact support with your transaction ID:
            </p>
            {txnid && (
              <p className="font-mono text-sm text-gray-800 mt-2">{txnid}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create-blog" className="btn-primary inline-flex items-center gap-2">
              <FiRefreshCw /> Try Again
            </Link>
            <Link href="/" className="btn-secondary inline-flex items-center gap-2">
              Go Home <FiArrowRight />
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getSettings, updateSettings, createLog } from "../../lib/api-client";

import { motion } from "framer-motion";
import { FiSave, FiCreditCard, FiToggleLeft, FiToggleRight, FiEye, FiEyeOff } from "react-icons/fi";

export default function AdminPayU() {
  return (
    <AdminGuard>
      <PayUContent />
    </AdminGuard>
  );
}

function PayUContent() {
  const [settings, setSettings] = useState({
    payuMerchantId: "",
    payuMerchantKey: "",
    payuMerchantSalt: "",
    payuTestMode: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showSalt, setShowSalt] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      setSettings({
        payuMerchantId: data.payuMerchantId || "",
        payuMerchantKey: data.payuMerchantKey || "",
        payuMerchantSalt: data.payuMerchantSalt || "",
        payuTestMode: data.payuTestMode !== false,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      await createLog({
        adminId: auth.currentUser?.uid,
        action: "Updated PayU Settings",
        targetId: "settings",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="admin-layout p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">PayU Payment Settings</h1>
          <p className="text-gray-600 mb-8">Configure PayU payment gateway for blog purchases</p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="max-w-2xl">
              <div className="bg-white rounded-xl shadow p-6 space-y-6">
                {/* Test Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiCreditCard className="w-6 h-6 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Test Mode</p>
                      <p className="text-sm text-gray-500">
                        Use PayU sandbox for testing payments
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({ ...settings, payuTestMode: !settings.payuTestMode })
                    }
                    className={`p-2 rounded-lg transition ${
                      settings.payuTestMode
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {settings.payuTestMode ? (
                      <FiToggleRight className="w-8 h-8" />
                    ) : (
                      <FiToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                {settings.payuTestMode && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Test Mode Active:</strong> Payments will use PayU sandbox environment. 
                      No real transactions will be processed.
                    </p>
                  </div>
                )}

                {/* Merchant ID */}
                <div>
                  <label className="form-label">Merchant ID (MID)</label>
                  <input
                    type="text"
                    value={settings.payuMerchantId}
                    onChange={(e) =>
                      setSettings({ ...settings, payuMerchantId: e.target.value })
                    }
                    className="form-input"
                    placeholder="Enter your PayU Merchant ID"
                  />
                </div>

                {/* Merchant Key */}
                <div>
                  <label className="form-label">Merchant Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={settings.payuMerchantKey}
                      onChange={(e) =>
                        setSettings({ ...settings, payuMerchantKey: e.target.value })
                      }
                      className="form-input pr-12"
                      placeholder="Enter your PayU Merchant Key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showKey ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Merchant Salt */}
                <div>
                  <label className="form-label">Merchant Salt</label>
                  <div className="relative">
                    <input
                      type={showSalt ? "text" : "password"}
                      value={settings.payuMerchantSalt}
                      onChange={(e) =>
                        setSettings({ ...settings, payuMerchantSalt: e.target.value })
                      }
                      className="form-input pr-12"
                      placeholder="Enter your PayU Merchant Salt"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSalt(!showSalt)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showSalt ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">How to get PayU credentials:</h3>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://payu.in/business" target="_blank" rel="noreferrer" className="underline">PayU Business</a></li>
                    <li>Sign up or login to your merchant account</li>
                    <li>Navigate to Dashboard → Key & Salt</li>
                    <li>Copy your Merchant ID, Key, and Salt</li>
                    <li>For testing, use PayU sandbox credentials</li>
                  </ol>
                </div>

                {/* Security Notice */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Security Notice:</strong> Keep your Merchant Key and Salt confidential. 
                    Never share these credentials publicly.
                  </p>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiSave />
                    )}
                    Save PayU Settings
                  </button>
                  {saved && (
                    <span className="text-green-600 font-medium">✓ Saved successfully!</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

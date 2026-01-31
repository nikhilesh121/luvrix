import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getSettings, updateSettings, createLog } from "../../lib/api-client";
import { auth } from "../../lib/local-auth";
import { motion } from "framer-motion";
import { FiSave, FiDollarSign, FiSettings, FiAlertTriangle, FiCheck, FiShield, FiBook, FiEye, FiEyeOff, FiMonitor, FiSmartphone, FiTablet, FiGlobe, FiSearch, FiFileText, FiCpu, FiKey, FiTrash2, FiRefreshCw, FiInfo } from "react-icons/fi";

// Cookie Settings Component
function CookieSettings() {
  const [cookieSettings, setCookieSettings] = useState({
    enabled: true,
    message: 'We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchCookieSettings();
  }, []);

  const fetchCookieSettings = async () => {
    try {
      const res = await fetch('/api/settings/cookies/');
      const data = await res.json();
      if (data) {
        setCookieSettings({
          enabled: data.enabled ?? true,
          message: data.message || 'We use cookies to enhance your browsing experience.',
        });
      }
    } catch (err) {
      console.error('Error fetching cookie settings:', err);
    }
  };

  const saveCookieSettings = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings/cookies/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cookieSettings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving cookie settings:', err);
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FiInfo className="text-amber-500" /> Cookie Consent Settings
      </h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Enable Cookie Banner</p>
            <p className="text-sm text-gray-500">Show cookie consent banner to new visitors</p>
          </div>
          <button
            onClick={() => setCookieSettings(s => ({ ...s, enabled: !s.enabled }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${cookieSettings.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${cookieSettings.enabled ? 'translate-x-7' : ''}`} />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Banner Message</label>
          <textarea
            value={cookieSettings.message}
            onChange={(e) => setCookieSettings(s => ({ ...s, message: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={saveCookieSettings}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave />}
          Save Cookie Settings
          {saved && <FiCheck className="text-green-300" />}
        </button>
      </div>
    </div>
  );
}

// Cache Management Component
function CacheManagement() {
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState(null);

  const clearCache = async (action) => {
    setClearing(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/cache/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setResult({ success: true, message: data.results?.join(', ') || 'Cache cleared' });
    } catch (err) {
      setResult({ success: false, message: 'Failed to clear cache' });
    }
    setClearing(false);
    setTimeout(() => setResult(null), 5000);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FiTrash2 className="text-red-500" /> Cache Management
      </h2>
      <p className="text-sm text-gray-500 mb-4">Clear various caches to free up space or fix issues.</p>
      {result && (
        <div className={`mb-4 p-3 rounded-lg ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.message}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => clearCache('all')}
          disabled={clearing}
          className="p-4 bg-red-50 hover:bg-red-100 rounded-xl text-center transition-colors border border-red-200"
        >
          <FiRefreshCw className={`w-6 h-6 mx-auto mb-2 text-red-500 ${clearing ? 'animate-spin' : ''}`} />
          <p className="font-medium text-red-700 text-sm">Clear All</p>
        </button>
        <button
          onClick={() => clearCache('next')}
          disabled={clearing}
          className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-center transition-colors border border-blue-200"
        >
          <FiCpu className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <p className="font-medium text-blue-700 text-sm">Next.js Cache</p>
        </button>
        <button
          onClick={() => clearCache('api')}
          disabled={clearing}
          className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition-colors border border-purple-200"
        >
          <FiGlobe className="w-6 h-6 mx-auto mb-2 text-purple-500" />
          <p className="font-medium text-purple-700 text-sm">API Cache</p>
        </button>
        <button
          onClick={() => clearCache('sessions')}
          disabled={clearing}
          className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl text-center transition-colors border border-amber-200"
        >
          <FiKey className="w-6 h-6 mx-auto mb-2 text-amber-500" />
          <p className="font-medium text-amber-700 text-sm">Expired Tokens</p>
        </button>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  return (
    <AdminGuard>
      <SettingsContent />
    </AdminGuard>
  );
}

function SettingsContent() {
  const [settings, setSettings] = useState({
    blogPostPrice: 49,
    autoApproval: false,
    minSeoScoreForAutoApproval: 80,
    minContentScoreForAutoApproval: 80,
    mangaVisibility: {
      web: true,
      mobileWeb: true,
      android: true,
      ios: true,
    },
    // Manga Page Layout Settings
    mangaLayout: {
      viewType: "grid", // grid, list, table
      columns: 5, // 1-6 columns
      cardSize: "medium", // small, medium, large
    },
    // Global Manga SEO Settings
    mangaSeoDefaults: {
      titleTemplate: "Read {title} Online - All Chapters Free",
      descriptionTemplate: "Read {title} manga online for free. {chapters} chapters available. Updated {status}.",
      chapterTitleTemplate: "{title} Chapter {chapter} - Read Online Free",
      chapterDescriptionTemplate: "Read {title} Chapter {chapter} online for free. High quality images, fast loading.",
      focusKeywordTemplate: "{title} manga, read {title} online, {title} chapters",
    },
    // AI Settings
    openaiApiKey: "",
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      setSettings({
        blogPostPrice: data.blogPostPrice || 49,
        autoApproval: data.autoApproval || false,
        minSeoScoreForAutoApproval: data.minSeoScoreForAutoApproval || 80,
        minContentScoreForAutoApproval: data.minContentScoreForAutoApproval || 80,
        mangaVisibility: data.mangaVisibility || { web: true, mobileWeb: true, android: true, ios: true },
        mangaLayout: data.mangaLayout || { viewType: "grid", columns: 5, cardSize: "medium" },
        mangaSeoDefaults: data.mangaSeoDefaults || {
          titleTemplate: "Read {title} Online - All Chapters Free",
          descriptionTemplate: "Read {title} manga online for free. {chapters} chapters available. Updated {status}.",
          chapterTitleTemplate: "{title} Chapter {chapter} - Read Online Free",
          chapterDescriptionTemplate: "Read {title} Chapter {chapter} online for free. High quality images, fast loading.",
          focusKeywordTemplate: "{title} manga, read {title} online, {title} chapters",
        },
        openaiApiKey: data.openaiApiKey || "",
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
        action: "Updated General Settings",
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">General Settings</h1>
          <p className="text-gray-600 mb-8">Configure pricing and other settings</p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="max-w-2xl space-y-6">
              {/* Pricing Settings */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiDollarSign /> Pricing Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="form-label">Blog Post Price (INR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        value={settings.blogPostPrice}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            blogPostPrice: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="form-input pl-10"
                        min="0"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Price per blog post after free limit is reached
                    </p>
                  </div>

                  {/* Pricing Info */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Current Pricing Structure:</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 1 Free blog post per user</li>
                      <li>• Additional posts: ₹{settings.blogPostPrice} each</li>
                      <li>• Bulk packages available (5, 10, 25, 50 posts)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Auto-Approval Settings */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiShield /> Blog Auto-Approval
                </h2>

                <div className="space-y-4">
                  {/* Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">Enable Auto-Approval</p>
                      <p className="text-sm text-gray-500">Automatically approve blogs that pass all checks</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, autoApproval: !settings.autoApproval })}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings.autoApproval ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        settings.autoApproval ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {settings.autoApproval && (
                    <>
                      <div>
                        <label className="form-label">Minimum SEO Score for Auto-Approval</label>
                        <input
                          type="number"
                          value={settings.minSeoScoreForAutoApproval}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              minSeoScoreForAutoApproval: parseInt(e.target.value, 10) || 80,
                            })
                          }
                          className="form-input"
                          min="0"
                          max="100"
                        />
                      </div>

                      <div>
                        <label className="form-label">Minimum Content Score for Auto-Approval</label>
                        <input
                          type="number"
                          value={settings.minContentScoreForAutoApproval}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              minContentScoreForAutoApproval: parseInt(e.target.value, 10) || 80,
                            })
                          }
                          className="form-input"
                          min="0"
                          max="100"
                        />
                      </div>

                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-800">Auto-Approval Criteria:</p>
                            <ul className="text-sm text-green-700 mt-1 space-y-1">
                              <li>• SEO Score ≥ {settings.minSeoScoreForAutoApproval}</li>
                              <li>• Content Policy Score ≥ {settings.minContentScoreForAutoApproval}</li>
                              <li>• No policy violations detected</li>
                              <li>• User confirmed policy compliance</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Manga Platform Visibility */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiBook /> Manga Platform Visibility
                </h2>
                <p className="text-sm text-gray-500 mb-6">Control manga visibility for each platform separately</p>

                <div className="space-y-4">
                  {/* Desktop Web */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        settings.mangaVisibility?.web ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gray-300'
                      }`}>
                        <FiMonitor className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Desktop Web</p>
                        <p className="text-sm text-gray-500">Show manga on desktop browsers</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        mangaVisibility: { ...settings.mangaVisibility, web: !settings.mangaVisibility?.web }
                      })}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings.mangaVisibility?.web ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        settings.mangaVisibility?.web ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Mobile Web */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        settings.mangaVisibility?.mobileWeb ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gray-300'
                      }`}>
                        <FiGlobe className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Mobile Web</p>
                        <p className="text-sm text-gray-500">Show manga on mobile browsers</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        mangaVisibility: { ...settings.mangaVisibility, mobileWeb: !settings.mangaVisibility?.mobileWeb }
                      })}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings.mangaVisibility?.mobileWeb ? 'bg-purple-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        settings.mangaVisibility?.mobileWeb ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Android App */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        settings.mangaVisibility?.android ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gray-300'
                      }`}>
                        <FiSmartphone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Android App</p>
                        <p className="text-sm text-gray-500">Show manga on Android devices</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        mangaVisibility: { ...settings.mangaVisibility, android: !settings.mangaVisibility?.android }
                      })}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings.mangaVisibility?.android ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        settings.mangaVisibility?.android ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* iOS App */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        settings.mangaVisibility?.ios ? 'bg-gradient-to-br from-gray-700 to-gray-900' : 'bg-gray-300'
                      }`}>
                        <FiTablet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">iOS App</p>
                        <p className="text-sm text-gray-500">Show manga on iPhone & iPad</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        mangaVisibility: { ...settings.mangaVisibility, ios: !settings.mangaVisibility?.ios }
                      })}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings.mangaVisibility?.ios ? 'bg-gray-700' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        settings.mangaVisibility?.ios ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Status Summary */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800 font-medium mb-2">Current Status:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${settings.mangaVisibility?.web ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      Desktop: {settings.mangaVisibility?.web ? 'Visible' : 'Hidden'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${settings.mangaVisibility?.mobileWeb ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      Mobile Web: {settings.mangaVisibility?.mobileWeb ? 'Visible' : 'Hidden'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${settings.mangaVisibility?.android ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      Android: {settings.mangaVisibility?.android ? 'Visible' : 'Hidden'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${settings.mangaVisibility?.ios ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      iOS: {settings.mangaVisibility?.ios ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Manga Page Layout Settings */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiMonitor /> Manga Page Layout
                </h2>
                <p className="text-sm text-gray-500 mb-6">Configure how manga cards appear on the manga listing page</p>

                <div className="space-y-6">
                  {/* View Type */}
                  <div>
                    <label className="form-label mb-3">Display Style</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "grid", label: "Grid View", desc: "Card layout" },
                        { id: "list", label: "List View", desc: "Compact rows" },
                        { id: "table", label: "Table View", desc: "Data table" },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSettings({
                            ...settings,
                            mangaLayout: { ...settings.mangaLayout, viewType: type.id }
                          })}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            settings.mangaLayout?.viewType === type.id
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <p className="font-semibold text-gray-800">{type.label}</p>
                          <p className="text-xs text-gray-500">{type.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Columns */}
                  {settings.mangaLayout?.viewType !== "table" && (
                    <div>
                      <label className="form-label mb-3">
                        Columns: <span className="text-primary font-bold">{settings.mangaLayout?.columns || 5}</span>
                      </label>
                      <div className="flex gap-2">
                        {[2, 3, 4, 5, 6].map((num) => (
                          <button
                            key={num}
                            onClick={() => setSettings({
                              ...settings,
                              mangaLayout: { ...settings.mangaLayout, columns: num }
                            })}
                            className={`w-12 h-12 rounded-xl font-bold transition-all ${
                              settings.mangaLayout?.columns === num
                                ? "bg-primary text-white shadow-lg shadow-primary/25"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Number of columns on desktop (auto-adjusts for mobile)</p>
                    </div>
                  )}

                  {/* Card Size */}
                  {settings.mangaLayout?.viewType === "grid" && (
                    <div>
                      <label className="form-label mb-3">Card Size</label>
                      <div className="flex gap-3">
                        {[
                          { id: "small", label: "Small" },
                          { id: "medium", label: "Medium" },
                          { id: "large", label: "Large" },
                        ].map((size) => (
                          <button
                            key={size.id}
                            onClick={() => setSettings({
                              ...settings,
                              mangaLayout: { ...settings.mangaLayout, cardSize: size.id }
                            })}
                            className={`px-6 py-3 rounded-xl font-medium transition-all ${
                              settings.mangaLayout?.cardSize === size.id
                                ? "bg-primary text-white shadow-lg shadow-primary/25"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Info */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-700">
                      <strong>Current:</strong> {settings.mangaLayout?.viewType?.charAt(0).toUpperCase() + settings.mangaLayout?.viewType?.slice(1)} view
                      {settings.mangaLayout?.viewType !== "table" && ` with ${settings.mangaLayout?.columns} columns`}
                      {settings.mangaLayout?.viewType === "grid" && `, ${settings.mangaLayout?.cardSize} cards`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Global Manga SEO Settings */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiSearch /> Global Manga SEO Templates
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Set default SEO templates for all manga. These will be used when individual manga don't have custom SEO settings.
                  <br />
                  <span className="text-purple-600 font-medium">Available placeholders:</span> {"{title}"}, {"{chapter}"}, {"{chapters}"}, {"{status}"}, {"{author}"}, {"{genre}"}
                </p>

                <div className="space-y-4">
                  {/* Manga Title Template */}
                  <div>
                    <label className="form-label">Manga Page Title Template</label>
                    <input
                      type="text"
                      value={settings.mangaSeoDefaults?.titleTemplate || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          mangaSeoDefaults: { ...settings.mangaSeoDefaults, titleTemplate: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="Read {title} Online - All Chapters Free"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: "Read Solo Leveling Online - All Chapters Free"
                    </p>
                  </div>

                  {/* Manga Description Template */}
                  <div>
                    <label className="form-label">Manga Page Description Template</label>
                    <textarea
                      value={settings.mangaSeoDefaults?.descriptionTemplate || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          mangaSeoDefaults: { ...settings.mangaSeoDefaults, descriptionTemplate: e.target.value },
                        })
                      }
                      className="form-input"
                      rows={2}
                      placeholder="Read {title} manga online for free. {chapters} chapters available."
                    />
                  </div>

                  {/* Chapter Title Template */}
                  <div>
                    <label className="form-label">Chapter Page Title Template</label>
                    <input
                      type="text"
                      value={settings.mangaSeoDefaults?.chapterTitleTemplate || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          mangaSeoDefaults: { ...settings.mangaSeoDefaults, chapterTitleTemplate: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="{title} Chapter {chapter} - Read Online Free"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: "Solo Leveling Chapter 150 - Read Online Free"
                    </p>
                  </div>

                  {/* Chapter Description Template */}
                  <div>
                    <label className="form-label">Chapter Page Description Template</label>
                    <textarea
                      value={settings.mangaSeoDefaults?.chapterDescriptionTemplate || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          mangaSeoDefaults: { ...settings.mangaSeoDefaults, chapterDescriptionTemplate: e.target.value },
                        })
                      }
                      className="form-input"
                      rows={2}
                      placeholder="Read {title} Chapter {chapter} online for free. High quality images."
                    />
                  </div>

                  {/* Focus Keyword Template */}
                  <div>
                    <label className="form-label">Focus Keywords Template</label>
                    <input
                      type="text"
                      value={settings.mangaSeoDefaults?.focusKeywordTemplate || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          mangaSeoDefaults: { ...settings.mangaSeoDefaults, focusKeywordTemplate: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="{title} manga, read {title} online, {title} chapters"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FiFileText className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-800">How it works:</p>
                        <ul className="text-sm text-purple-700 mt-1 space-y-1">
                          <li>• These templates apply to manga without custom SEO settings</li>
                          <li>• Individual manga settings override these defaults</li>
                          <li>• Placeholders are automatically replaced with actual values</li>
                          <li>• Edit individual manga in Manage Manga for custom SEO</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Settings */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiCpu /> AI Blog Generation Settings
                </h2>
                <p className="text-sm text-gray-500 mb-6">Configure OpenAI API for AI-powered blog draft generation</p>

                <div className="space-y-4">
                  <div>
                    <label className="form-label flex items-center gap-2">
                      <FiKey className="w-4 h-4" /> OpenAI API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={settings.openaiApiKey}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            openaiApiKey: e.target.value,
                          })
                        }
                        className="form-input pr-12 font-mono text-sm"
                        placeholder="sk-proj-..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showApiKey ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Platform</a>
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FiCpu className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-800">AI Features:</p>
                        <ul className="text-sm text-purple-700 mt-1 space-y-1">
                          <li>• <strong>Trending Topics:</strong> Fetch trending searches from Google Trends</li>
                          <li>• <strong>AI Draft Generation:</strong> Generate blog posts using GPT-4o-mini</li>
                          <li>• <strong>SEO Optimization:</strong> Auto-generate titles, descriptions, and keywords</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FiAlertTriangle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Note:</p>
                        <p className="text-sm text-green-700 mt-1">
                          API key changes are saved to the database and take effect immediately.
                          No additional deployment steps required.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MongoDB Info */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiSettings /> Database Configuration
                </h2>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FiAlertTriangle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">MongoDB Connected</p>
                      <p className="text-sm text-green-700 mt-1">
                        Database is configured in <code className="bg-green-100 px-2 py-0.5 rounded">.env.local</code>
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        All data is stored locally on your server with MongoDB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cookie Consent Settings */}
              <CookieSettings />

              {/* Cache Management */}
              <CacheManagement />

              {/* Deployment Info */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Deployment Guide</h2>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Build Commands:</h3>
                    <code className="block bg-gray-900 text-green-400 p-3 rounded text-sm">
                      npm run build
                    </code>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Hostinger Deployment:</h3>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Run <code className="bg-gray-200 px-1 rounded">npm run build</code></li>
                      <li>Upload contents of <code className="bg-gray-200 px-1 rounded">out/</code> folder to <code className="bg-gray-200 px-1 rounded">public_html/</code></li>
                      <li>Your site is live!</li>
                    </ol>
                  </div>
                </div>
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
                  Save Settings
                </button>
                {saved && (
                  <span className="text-green-600 font-medium">✓ Saved successfully!</span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

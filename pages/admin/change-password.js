import { useState } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { createLog } from "../../lib/firebase-client";
import { motion } from "framer-motion";
import { FiSave, FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle } from "react-icons/fi";

export default function ChangePassword() {
  return (
    <AdminGuard>
      <ChangePasswordContent />
    </AdminGuard>
  );
}

function ChangePasswordContent() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const validatePassword = (password) => {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain a number";
    if (!/[!@#$%^&*]/.test(password)) return "Password must contain a special character (!@#$%^&*)";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error("New passwords do not match");
      }

      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        throw new Error(passwordError);
      }

      const token = localStorage.getItem("luvrix_auth_token");
      if (!token) {
        throw new Error("No user logged in");
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to change password");
      }

      await createLog({
        adminId: data.userId,
        action: "Changed Password",
        targetId: data.userId,
      });

      setSuccess("Password changed successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password change error:", error);
      setError(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="admin-layout p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Change Password</h1>
          <p className="text-gray-600 mb-8">Update your admin account password</p>

          <div className="max-w-md">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="form-label">Current Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="form-input pl-10 pr-12"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="form-label">New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="form-input pl-10 pr-12"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="form-label">Confirm New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input pl-10 pr-12"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Password Requirements:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className={formData.newPassword.length >= 8 ? "text-green-600" : ""}>
                    • At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(formData.newPassword) ? "text-green-600" : ""}>
                    • One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(formData.newPassword) ? "text-green-600" : ""}>
                    • One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(formData.newPassword) ? "text-green-600" : ""}>
                    • One number
                  </li>
                  <li className={/[!@#$%^&*]/.test(formData.newPassword) ? "text-green-600" : ""}>
                    • One special character (!@#$%^&*)
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSave />
                )}
                Change Password
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

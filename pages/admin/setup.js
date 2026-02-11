import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getAllUsers } from "../../lib/api-client";
import { FiShield, FiCheck, FiAlertCircle } from "react-icons/fi";

export default function AdminSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasAdmin, setHasAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "nikhileshpr@gmail.com";
  const adminPassword = "Rohan@222";

  useEffect(() => {
    checkExistingAdmin();
  }, []);

  const checkExistingAdmin = async () => {
    try {
      const users = await getAllUsers();
      const adminExists = users.some((u) => u.role === "ADMIN");
      setHasAdmin(adminExists);
    } catch (error) {
      console.error("Error checking admin:", error);
      setCheckingAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const createAdminAccount = async () => {
    setLoading(true);
    setError("");

    try {
      // Try to register new admin account via API
      const response = await fetch("/api/auth/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || "Admin account created successfully!");
        setStep(2);
      } else {
        throw new Error(data.error || "Failed to create admin account");
      }
    } catch (error) {
      console.error("Setup error:", error);
      setError(error.message || "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (hasAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Already Exists</h1>
          <p className="text-gray-600 mb-6">
            An admin account has already been set up for this application.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="btn-primary w-full"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Setup</h1>
          <p className="text-gray-600 mt-2">Set up your admin account</p>
        </div>

        {step === 1 && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Admin Account Details:</h3>
              <p className="text-sm text-blue-700">
                <strong>Email:</strong> {adminEmail}<br />
                <strong>Password:</strong> Rohan@222
              </p>
              <p className="text-xs text-blue-600 mt-2">
                You can change your password after logging in.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={createAdminAccount}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiShield />
              )}
              Create Admin Account
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Setup Complete!</h2>
            <p className="text-gray-600 mb-6">{success}</p>
            <button
              onClick={() => router.push("/login")}
              className="btn-primary w-full"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

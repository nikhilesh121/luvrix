import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { auth } from "../../lib/local-auth";
import { motion } from "framer-motion";
import {
  FiShield, FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiAlertTriangle, FiInfo, FiAlertCircle, FiXCircle, FiClock, FiUser
} from "react-icons/fi";

export default function AdminAuditLogs() {
  return (
    <AdminGuard>
      <AuditLogsContent />
    </AdminGuard>
  );
}

function AuditLogsContent() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: "",
    severity: "",
    search: "",
  });
  const limit = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = auth.getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filters.category) params.set("category", filters.category);
      if (filters.severity) params.set("severity", filters.severity);

      const res = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data.logs || []);
      setStats(data.stats || null);
      setTotalPages(Math.ceil((data.total || 0) / limit) || 1);
    } catch (err) {
      console.error("Fetch audit logs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters.category, filters.severity]);

  const severityIcon = (severity) => {
    switch (severity) {
      case "critical": return <FiXCircle className="w-4 h-4 text-red-400" />;
      case "error": return <FiAlertCircle className="w-4 h-4 text-orange-400" />;
      case "warning": return <FiAlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <FiInfo className="w-4 h-4 text-blue-400" />;
    }
  };

  const severityColor = (severity) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "error": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "warning": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const filteredLogs = filters.search
    ? logs.filter(
        (l) =>
          (l.action || "").toLowerCase().includes(filters.search.toLowerCase()) ||
          (l.userEmail || "").toLowerCase().includes(filters.search.toLowerCase()) ||
          (l.category || "").toLowerCase().includes(filters.search.toLowerCase())
      )
    : logs;

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <FiShield className="w-5 h-5 text-purple-400" />
                </div>
                Audit Logs
              </h1>
              <p className="text-gray-400 mt-1">SOC2-compliant activity trail with 7-year retention</p>
            </div>
            <button
              onClick={() => { setPage(1); fetchLogs(); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition-all border border-white/10"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(stats).slice(0, 4).map(([key, value]) => (
                <div key={key} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-gray-400 text-xs uppercase tracking-wider">{key.replace(/_/g, " ")}</p>
                  <p className="text-2xl font-bold text-white mt-1">{typeof value === "number" ? value.toLocaleString() : value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search actions, emails..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-purple-500/50"
            >
              <option value="">All Categories</option>
              <option value="user_management">User Management</option>
              <option value="content_management">Content Management</option>
              <option value="system_config">System Config</option>
              <option value="security">Security</option>
              <option value="data_access">Data Access</option>
              <option value="authentication">Authentication</option>
            </select>
            <select
              value={filters.severity}
              onChange={(e) => { setFilters({ ...filters, severity: e.target.value }); setPage(1); }}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:border-purple-500/50"
            >
              <option value="">All Severity</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Logs Table */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <FiShield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No audit logs found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredLogs.map((log, i) => (
                  <motion.div
                    key={log._id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{severityIcon(log.severity)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white text-sm">
                            {(log.action || "unknown").replace(/_/g, " ")}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColor(log.severity)}`}>
                            {log.severity || "info"}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                            {log.category || "general"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiUser className="w-3 h-3" />
                            {log.userEmail || log.userId || "system"}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                          </span>
                          {log.ipAddress && (
                            <span className="text-gray-600">{log.ipAddress}</span>
                          )}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500 bg-white/5 rounded-lg p-2 font-mono overflow-x-auto">
                            {JSON.stringify(log.details, null, 0).slice(0, 200)}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
              >
                <FiChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
              >
                Next <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

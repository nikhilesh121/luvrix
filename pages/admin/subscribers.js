import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getAllSubscribers, deleteSubscriber, updateSubscriberStatus } from "../../lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiMail, FiTrash2, FiDownload, FiSearch, FiCheck, FiX, 
  FiUsers, FiCalendar, FiCopy, FiCheckCircle, FiAlertCircle
} from "react-icons/fi";

export default function AdminSubscribers() {
  return (
    <AdminGuard>
      <SubscribersContent />
    </AdminGuard>
  );
}

function SubscribersContent() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const data = await getAllSubscribers();
      setSubscribers(data);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;
    setDeleting(id);
    try {
      await deleteSubscriber(id);
      setSubscribers(subscribers.filter(s => s.id !== id));
    } catch (error) {
      console.error("Error deleting subscriber:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "unsubscribed" : "active";
    try {
      await updateSubscriberStatus(id, newStatus);
      setSubscribers(subscribers.map(s => 
        s.id === id ? { ...s, status: newStatus } : s
      ));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleExportCSV = () => {
    const activeEmails = subscribers
      .filter(s => s.status === "active")
      .map(s => s.email);
    
    const csv = "Email\n" + activeEmails.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyEmails = () => {
    const activeEmails = subscribers
      .filter(s => s.status === "active")
      .map(s => s.email)
      .join(", ");
    
    navigator.clipboard.writeText(activeEmails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSubscribers = subscribers.filter(s => {
    const matchesSearch = s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = subscribers.filter(s => s.status === "active").length;
  const unsubscribedCount = subscribers.filter(s => s.status === "unsubscribed").length;

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", month: "short", day: "numeric" 
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="admin-layout p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Subscribers</h1>
              <p className="text-gray-600">Manage newsletter subscribers</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopyEmails}
                className="btn-secondary flex items-center gap-2"
              >
                {copied ? <FiCheckCircle className="text-green-500" /> : <FiCopy />}
                {copied ? "Copied!" : "Copy Emails"}
              </button>
              <button
                onClick={handleExportCSV}
                className="btn-primary flex items-center gap-2"
              >
                <FiDownload /> Export CSV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FiUsers className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Subscribers</p>
                  <p className="text-3xl font-bold text-gray-800">{subscribers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <FiCheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-3xl font-bold text-green-600">{activeCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center">
                  <FiAlertCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unsubscribed</p>
                  <p className="text-3xl font-bold text-gray-600">{unsubscribedCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2">
                {["all", "active", "unsubscribed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      statusFilter === status
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="text-center py-12">
                <FiMail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No subscribers found</h3>
                <p className="text-gray-500">
                  {searchQuery ? "Try a different search term" : "Subscribers will appear here"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">#</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Subscribed</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <AnimatePresence>
                      {filteredSubscribers.map((subscriber, index) => (
                        <motion.tr
                          key={subscriber.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                                <FiMail className="w-5 h-5 text-primary" />
                              </div>
                              <span className="font-medium text-gray-800">{subscriber.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleStatusToggle(subscriber.id, subscriber.status)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                subscriber.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {subscriber.status === "active" ? "Active" : "Unsubscribed"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <FiCalendar className="w-4 h-4" />
                              {formatDate(subscriber.subscribedAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDelete(subscriber.id)}
                                disabled={deleting === subscriber.id}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                {deleting === subscriber.id ? (
                                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <FiTrash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-700 text-sm">
              <strong>Tip:</strong> You can export active subscribers to CSV for use with email marketing services like Brevo, Mailchimp, or SendGrid.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getAllPayments, getAllUsers } from "../../lib/firebase-client";
import { motion } from "framer-motion";
import { FiDollarSign, FiTrendingUp, FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function AdminPayments() {
  return (
    <AdminGuard>
      <PaymentsContent />
    </AdminGuard>
  );
}

function PaymentsContent() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    revenue: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsData, usersData] = await Promise.all([
        getAllPayments(),
        getAllUsers(),
      ]);

      // Create users lookup
      const usersLookup = {};
      usersData.forEach((u) => {
        usersLookup[u.id] = u;
      });
      setUsers(usersLookup);

      setPayments(paymentsData);

      // Calculate stats
      const successful = paymentsData.filter((p) => p.status === "success");
      const failed = paymentsData.filter((p) => p.status === "failed");
      const revenue = successful.reduce((sum, p) => sum + (p.amount || 0), 0);

      setStats({
        total: paymentsData.length,
        successful: successful.length,
        failed: failed.length,
        revenue,
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const statCards = [
    {
      title: "Total Payments",
      value: stats.total,
      icon: FiDollarSign,
      color: "bg-blue-500",
    },
    {
      title: "Successful",
      value: stats.successful,
      icon: FiCheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Failed",
      value: stats.failed,
      icon: FiXCircle,
      color: "bg-red-500",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.revenue}`,
      icon: FiTrendingUp,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="admin-layout p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payments</h1>
          <p className="text-gray-600 mb-8">View payment history and revenue</p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">{card.title}</p>
                        <p className="text-3xl font-bold text-gray-800 mt-1">
                          {card.value}
                        </p>
                      </div>
                      <div
                        className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}
                      >
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Payments Table */}
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>User</th>
                        <th>Amount</th>
                        <th>Posts Added</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length > 0 ? (
                        payments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="font-mono text-sm">
                              {payment.txnId || payment.id}
                            </td>
                            <td>
                              <div>
                                <p className="font-medium">
                                  {users[payment.userId]?.name || "Unknown"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {users[payment.userId]?.email || payment.userId}
                                </p>
                              </div>
                            </td>
                            <td className="font-semibold">₹{payment.amount}</td>
                            <td>{payment.postsAdded || 0}</td>
                            <td>
                              <span
                                className={`badge ${
                                  payment.status === "success"
                                    ? "badge-success"
                                    : "badge-failed"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </td>
                            <td>{formatDate(payment.createdAt)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            No payments yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

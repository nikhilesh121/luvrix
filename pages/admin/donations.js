import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { motion } from "framer-motion";
import {
  FiHeart, FiDollarSign, FiSearch, FiUsers, FiMail,
  FiArrowUp, FiGift, FiUser, FiCalendar,
} from "react-icons/fi";

export default function AdminDonations() {
  return (
    <AdminGuard>
      <DonationsContent />
    </AdminGuard>
  );
}

function DonationsContent() {
  const [data, setData] = useState({ donations: [], topDonors: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | top
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("luvrix_auth_token");
        const res = await fetch("/api/giveaways/all-donors", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch (err) {
        console.error("Error fetching donors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const grandTotal = data.donations.reduce((sum, d) => sum + (d.amount || 0), 0);

  const filteredDonations = data.donations.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.donorName || "").toLowerCase().includes(q) ||
      (d.donorEmail || "").toLowerCase().includes(q) ||
      (d.giveawayTitle || "").toLowerCase().includes(q)
    );
  });

  const filteredTopDonors = data.topDonors.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      <div className="admin-layout p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FiHeart className="text-pink-500" /> Donation Management
              </h1>
              <p className="text-gray-500 mt-1">Track all giveaway donations and top donors</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Total Donations</span>
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <FiDollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">₹{grandTotal.toLocaleString()}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Total Donors</span>
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-pink-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.topDonors.length}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Total Transactions</span>
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FiHeart className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.donations.length}</p>
            </motion.div>
          </div>

          {/* Tabs + Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100">
              <button onClick={() => setTab("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  tab === "all" ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:text-gray-700"
                }`}>
                All Donations
              </button>
              <button onClick={() => setTab("top")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  tab === "top" ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:text-gray-700"
                }`}>
                <FiArrowUp className="w-3.5 h-3.5" /> Top Donors
              </button>
            </div>

            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
                placeholder="Search by name, email, or giveaway..." />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse h-20" />
              ))}
            </div>
          ) : (
            <>
              {/* All Donations Tab */}
              {tab === "all" && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {filteredDonations.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                      <FiHeart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No donations found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-3">Donor</div>
                        <div className="col-span-3">Email</div>
                        <div className="col-span-3">Giveaway</div>
                        <div className="col-span-1">Amount</div>
                        <div className="col-span-2">Date</div>
                      </div>

                      {filteredDonations.map((d, i) => (
                        <motion.div key={d.id || i}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors"
                        >
                          <div className="col-span-3 flex items-center gap-3 min-w-0">
                            {d.userPhoto ? (
                              <img src={d.userPhoto} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                                <FiUser className="w-3.5 h-3.5 text-pink-500" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{d.donorName || "Unknown"}</p>
                              {d.isAnonymous && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Anonymous</span>}
                            </div>
                          </div>
                          <div className="col-span-3 text-sm text-gray-500 truncate">{d.donorEmail || "—"}</div>
                          <div className="col-span-3 text-sm text-gray-700 truncate">{d.giveawayTitle}</div>
                          <div className="col-span-1 text-sm font-bold text-green-600">₹{d.amount}</div>
                          <div className="col-span-2 text-xs text-gray-400">
                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Top Donors Tab */}
              {tab === "top" && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {filteredTopDonors.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                      <FiUsers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No donors found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-1">Rank</div>
                        <div className="col-span-3">Donor</div>
                        <div className="col-span-4">Email</div>
                        <div className="col-span-2">Donations</div>
                        <div className="col-span-2">Total</div>
                      </div>

                      {filteredTopDonors.map((d, i) => (
                        <motion.div key={d.email || i}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                          className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors"
                        >
                          <div className="col-span-1">
                            {i < 3 ? (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                i === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
                                i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400" :
                                "bg-gradient-to-br from-orange-300 to-orange-400"
                              }`}>
                                {i + 1}
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-gray-400 pl-2">#{i + 1}</span>
                            )}
                          </div>
                          <div className="col-span-3 flex items-center gap-3 min-w-0">
                            {d.photo ? (
                              <img src={d.photo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <FiUser className="w-3.5 h-3.5 text-purple-500" />
                              </div>
                            )}
                            <p className="text-sm font-semibold text-gray-900 truncate">{d.name || "Unknown"}</p>
                          </div>
                          <div className="col-span-4 text-sm text-gray-500 truncate flex items-center gap-1.5">
                            <FiMail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {d.email || "—"}
                          </div>
                          <div className="col-span-2 text-sm text-gray-600">{d.count} donation{d.count !== 1 ? "s" : ""}</div>
                          <div className="col-span-2 text-sm font-bold text-green-600">₹{d.total.toLocaleString()}</div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

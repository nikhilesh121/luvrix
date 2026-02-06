import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import Avatar from "../../components/Avatar";
import { getAllUsers, updateUser, deleteUser, createLog, hideUserPosts, unhideUserPosts } from "../../lib/api-client";
import { auth } from "../../lib/local-auth";
import { motion } from "framer-motion";
import { FiSearch, FiUserX, FiUserCheck, FiShield, FiUser, FiTrash2, FiLoader, FiUsers, FiCheckCircle, FiAlertCircle, FiEdit3, FiX, FiPlus, FiKey } from "react-icons/fi";

export default function AdminUsers() {
  return (
    <AdminGuard>
      <UsersContent />
    </AdminGuard>
  );
}

function UsersContent() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [editPointsModal, setEditPointsModal] = useState({ open: false, user: null });
  const [resetPasswordModal, setResetPasswordModal] = useState({ open: false, user: null });
  const [resetResult, setResetResult] = useState(null);
  const [newPoints, setNewPoints] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userId, currentBlocked) => {
    setActionLoading(userId);
    try {
      await updateUser(userId, { blocked: !currentBlocked });
      
      // Auto hide/unhide posts when blocking/unblocking
      if (!currentBlocked) {
        // Blocking user - hide their posts
        const result = await hideUserPosts(userId);
        await createLog({
          adminId: auth.currentUser?.uid,
          action: "Blocked User",
          targetId: userId,
          details: `Hidden ${result.count || 0} posts`,
        });
      } else {
        // Unblocking user - restore their posts
        const result = await unhideUserPosts(userId);
        await createLog({
          adminId: auth.currentUser?.uid,
          action: "Unblocked User",
          targetId: userId,
          details: `Restored ${result.count || 0} posts`,
        });
      }
      
      fetchUsers();
    } catch (error) {
      console.error("Error toggling block:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAdmin = async (userId, currentRole) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Are you sure you want to ${newRole === "ADMIN" ? "make this user an admin" : "remove admin rights"}?`)) {
      return;
    }

    setActionLoading(userId);
    try {
      await updateUser(userId, { role: newRole });
      await createLog({
        adminId: auth.currentUser?.uid,
        action: newRole === "ADMIN" ? "Made User Admin" : "Removed Admin Rights",
        targetId: userId,
      });
      fetchUsers();
    } catch (error) {
      console.error("Error toggling admin:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to DELETE user "${userEmail}"? This action cannot be undone. All their blog posts will remain but marked as orphaned.`)) {
      return;
    }

    setActionLoading(userId);
    try {
      await deleteUser(userId);
      await createLog({
        adminId: "admin",
        action: "Deleted User",
        targetId: userId,
        details: userEmail,
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (user) => {
    setResetPasswordModal({ open: true, user });
    setResetResult(null);
  };

  const confirmResetPassword = async () => {
    if (!resetPasswordModal.user) return;
    setActionLoading(resetPasswordModal.user.id);
    try {
      const token = localStorage.getItem('luvrix_auth_token');
      const res = await fetch(`/api/admin/users/${resetPasswordModal.user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setResetResult(data);
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error resetting password:", error);
      setResetResult({ success: false, message: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  const openEditPointsModal = (user) => {
    setEditPointsModal({ open: true, user });
    setNewPoints(user.extraPosts?.toString() || "0");
  };

  const handleUpdatePoints = async () => {
    if (!editPointsModal.user) return;
    
    const points = parseInt(newPoints, 10);
    if (isNaN(points) || points < 0) {
      alert("Please enter a valid number of points (0 or higher)");
      return;
    }

    setActionLoading(editPointsModal.user.id);
    try {
      const token = localStorage.getItem('luvrix_auth_token');
      const res = await fetch(`/api/admin/users/${editPointsModal.user.id}/points`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ points })
      });
      
      // Get response text first to handle empty responses
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse response:", text);
      }
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update points');
      }
      
      await createLog({
        adminId: auth.currentUser?.uid || "admin",
        action: "Added User Points",
        targetId: editPointsModal.user.id,
        details: `Added ${points} extra posts`,
      });
      
      setEditPointsModal({ open: false, user: null });
      setNewPoints("");
      setSuccessMessage(data.message || `Added ${points} points successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
    } catch (error) {
      console.error("Error updating points:", error);
      alert(error.message || "Failed to update points");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const activeCount = users.filter(u => !u.blocked).length;
  const adminCount = users.filter(u => u.role === "ADMIN").length;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminSidebar />

      <div className="admin-layout">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FiUsers className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white">Manage Users</h1>
                  <p className="text-slate-400">View and manage user accounts</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-xl border border-green-500/30 flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-200 text-sm font-medium">{activeCount} Active</span>
                </div>
                <div className="px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-xl border border-purple-500/30 flex items-center gap-2">
                  <FiShield className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-200 text-sm font-medium">{adminCount} Admins</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-6">
          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
            >
              <FiCheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">{successMessage}</span>
            </motion.div>
          )}

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 mb-6 border border-slate-100"
          >
            <div className="relative max-w-md">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800"
              />
            </div>
          </motion.div>

          {/* Users Table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Posts</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, index) => (
                        <motion.tr 
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar user={user} size={40} />
                              <div>
                                <p className="font-semibold text-slate-900">{user.name || "No Name"}</p>
                                <p className="text-sm text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              user.role === "ADMIN" 
                                ? "bg-purple-100 text-purple-700" 
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {user.role === "ADMIN" ? <FiShield className="w-3.5 h-3.5" /> : <FiUser className="w-3.5 h-3.5" />}
                              {user.role || "USER"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <span className="font-medium text-slate-700">{user.freePostsUsed || 0}/1</span>
                              {(user.extraPosts || 0) > 0 && (
                                <span className="text-emerald-600 ml-2">+{user.extraPosts}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              user.blocked 
                                ? "bg-red-100 text-red-700" 
                                : "bg-green-100 text-green-700"
                            }`}>
                              {user.blocked ? <FiAlertCircle className="w-3.5 h-3.5" /> : <FiCheckCircle className="w-3.5 h-3.5" />}
                              {user.blocked ? "Blocked" : "Active"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              {actionLoading === user.id ? (
                                <div className="p-2">
                                  <FiLoader className="w-4 h-4 animate-spin text-slate-400" />
                                </div>
                              ) : (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleToggleBlock(user.id, user.blocked)}
                                    disabled={actionLoading === user.id}
                                    className={`p-2.5 rounded-xl transition-all ${
                                      user.blocked
                                        ? "text-green-600 hover:bg-green-50"
                                        : "text-amber-600 hover:bg-amber-50"
                                    }`}
                                    title={user.blocked ? "Unblock User" : "Block User"}
                                  >
                                    {user.blocked ? <FiUserCheck className="w-4 h-4" /> : <FiUserX className="w-4 h-4" />}
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleToggleAdmin(user.id, user.role)}
                                    disabled={actionLoading === user.id}
                                    className={`p-2.5 rounded-xl transition-all ${
                                      user.role === "ADMIN"
                                        ? "text-amber-600 hover:bg-amber-50"
                                        : "text-purple-600 hover:bg-purple-50"
                                    }`}
                                    title={user.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
                                  >
                                    {user.role === "ADMIN" ? <FiUser className="w-4 h-4" /> : <FiShield className="w-4 h-4" />}
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => openEditPointsModal(user)}
                                    disabled={actionLoading === user.id}
                                    className="p-2.5 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-all"
                                    title="Edit Blog Points"
                                  >
                                    <FiPlus className="w-4 h-4" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleResetPassword(user)}
                                    disabled={actionLoading === user.id}
                                    className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-all"
                                    title="Reset Password"
                                  >
                                    <FiKey className="w-4 h-4" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                    disabled={actionLoading === user.id}
                                    className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                                    title="Delete User"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-16">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiUsers className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 font-medium">No users found</p>
                          <p className="text-sm text-slate-400">Try adjusting your search</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Edit Points Modal */}
      {editPointsModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FiPlus className="w-5 h-5 text-emerald-500" />
                Add Blog Points
              </h3>
              <button
                onClick={() => { setEditPointsModal({ open: false, user: null }); setNewPoints(""); }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <FiX className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl">
                <Avatar user={editPointsModal.user} size={48} />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{editPointsModal.user?.name || "No Name"}</p>
                  <p className="text-sm text-slate-500">{editPointsModal.user?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Current Balance</p>
                  <p className="text-xl font-bold text-emerald-600">+{editPointsModal.user?.extraPosts || 0}</p>
                </div>
              </div>
              
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Points to Add
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">+</span>
                <input
                  type="number"
                  min="1"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 text-lg font-medium"
                  placeholder="Enter points to add"
                />
              </div>
              
              {/* Quick add buttons */}
              <div className="flex gap-2 mt-3">
                {[1, 5, 10, 25, 50].map(val => (
                  <button
                    key={val}
                    onClick={() => setNewPoints(val.toString())}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      newPoints === val.toString() 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    +{val}
                  </button>
                ))}
              </div>
              
              {newPoints && parseInt(newPoints) > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">New Balance:</span> {(editPointsModal.user?.extraPosts || 0)} + {newPoints} = <span className="font-bold text-blue-800">{(editPointsModal.user?.extraPosts || 0) + parseInt(newPoints)} points</span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setEditPointsModal({ open: false, user: null }); setNewPoints(""); }}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePoints}
                disabled={actionLoading || !newPoints || parseInt(newPoints) <= 0}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30"
              >
                {actionLoading ? (
                  <FiLoader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <FiPlus className="w-4 h-4" />
                    Add Points
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Reset Password Modal */}
      {resetPasswordModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FiKey className="w-5 h-5 text-blue-500" />
                Reset Password
              </h3>
              <button
                onClick={() => { setResetPasswordModal({ open: false, user: null }); setResetResult(null); }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <FiX className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                <Avatar user={resetPasswordModal.user} size={48} />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{resetPasswordModal.user?.name || "No Name"}</p>
                  <p className="text-sm text-slate-500">{resetPasswordModal.user?.email}</p>
                </div>
              </div>

              {!resetResult ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800">
                    <strong>Warning:</strong> This will generate a new random password and send it to the user&apos;s email. The user&apos;s current password will be invalidated.
                  </p>
                </div>
              ) : resetResult.success ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-800 font-medium mb-1">
                    <FiCheckCircle className="w-4 h-4 inline mr-1" />
                    {resetResult.emailSent ? "Password reset email sent!" : "Password reset successful"}
                  </p>
                  {resetResult.tempPassword && (
                    <div className="mt-2 p-3 bg-white rounded-lg border border-green-200">
                      <p className="text-xs text-gray-500 mb-1">Email failed. Temp password (copy it now):</p>
                      <p className="font-mono text-lg font-bold text-gray-900 select-all">{resetResult.tempPassword}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">
                    <FiAlertCircle className="w-4 h-4 inline mr-1" />
                    {resetResult.message || "Failed to reset password"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setResetPasswordModal({ open: false, user: null }); setResetResult(null); }}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                {resetResult ? "Close" : "Cancel"}
              </button>
              {!resetResult && (
                <button
                  onClick={confirmResetPassword}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  {actionLoading ? (
                    <FiLoader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <FiKey className="w-4 h-4" />
                      Reset Password
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

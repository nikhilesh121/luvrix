import { useState, useEffect } from "react";
import AdminGuard from "../../components/AdminGuard";
import AdminSidebar from "../../components/AdminSidebar";
import { getSettings, updateSettings } from "../../lib/firebase-client";
import { motion } from "framer-motion";
import { 
  FiMenu, FiPlus, FiTrash2, FiSave, FiChevronDown, FiChevronUp,
  FiEdit2, FiX, FiLoader
} from "react-icons/fi";

export default function AdminMenus() {
  return (
    <AdminGuard>
      <MenusContent />
    </AdminGuard>
  );
}

function MenusContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menus, setMenus] = useState([]);
  const [editingMenu, setEditingMenu] = useState(null);
  const [newMenuName, setNewMenuName] = useState("");
  const [newSubmenuName, setNewSubmenuName] = useState("");
  const [expandedMenu, setExpandedMenu] = useState(null);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const settings = await getSettings();
      const menuData = settings.navigationMenus || getDefaultMenus();
      setMenus(menuData);
    } catch (error) {
      console.error("Error fetching menus:", error);
      setMenus(getDefaultMenus());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultMenus = () => [
    {
      id: "news",
      name: "News",
      submenus: [
        { id: "politics", name: "Politics", href: "/categories?category=Politics" },
        { id: "business", name: "Business", href: "/categories?category=Business" },
        { id: "sports", name: "Sports", href: "/categories?category=Sports" },
        { id: "science", name: "Science", href: "/categories?category=Science" },
      ],
    },
    {
      id: "blog",
      name: "Blog",
      submenus: [
        { id: "food", name: "Food", href: "/categories?category=Food" },
        { id: "travel", name: "Travel", href: "/categories?category=Travel" },
        { id: "lifestyle", name: "Lifestyle", href: "/categories?category=Lifestyle" },
        { id: "health", name: "Health", href: "/categories?category=Health" },
      ],
    },
    {
      id: "entertainment",
      name: "Entertainment",
      submenus: [
        { id: "anime", name: "Anime", href: "/categories?category=Anime" },
        { id: "gaming", name: "Gaming", href: "/categories?category=Gaming" },
        { id: "movies", name: "Movies", href: "/categories?category=Entertainment" },
        { id: "music", name: "Music", href: "/categories?category=Entertainment" },
      ],
    },
  ];

  const saveMenus = async () => {
    setSaving(true);
    try {
      await updateSettings({ navigationMenus: menus });
      alert("Menus saved successfully!");
    } catch (error) {
      console.error("Error saving menus:", error);
      alert("Failed to save menus");
    } finally {
      setSaving(false);
    }
  };

  const addMenu = () => {
    if (!newMenuName.trim()) return;
    const newMenu = {
      id: newMenuName.toLowerCase().replace(/\s+/g, "-"),
      name: newMenuName.trim(),
      submenus: [],
    };
    setMenus([...menus, newMenu]);
    setNewMenuName("");
  };

  const deleteMenu = (menuId) => {
    if (!confirm("Are you sure you want to delete this menu?")) return;
    setMenus(menus.filter((m) => m.id !== menuId));
  };

  const updateMenuName = (menuId, newName) => {
    setMenus(menus.map((m) => (m.id === menuId ? { ...m, name: newName } : m)));
  };

  const addSubmenu = (menuId) => {
    if (!newSubmenuName.trim()) return;
    const newSubmenu = {
      id: newSubmenuName.toLowerCase().replace(/\s+/g, "-"),
      name: newSubmenuName.trim(),
      href: `/categories?category=${newSubmenuName.trim()}`,
    };
    setMenus(
      menus.map((m) =>
        m.id === menuId ? { ...m, submenus: [...m.submenus, newSubmenu] } : m
      )
    );
    setNewSubmenuName("");
  };

  const deleteSubmenu = (menuId, submenuId) => {
    setMenus(
      menus.map((m) =>
        m.id === menuId
          ? { ...m, submenus: m.submenus.filter((s) => s.id !== submenuId) }
          : m
      )
    );
  };

  const updateSubmenu = (menuId, submenuId, field, value) => {
    setMenus(
      menus.map((m) =>
        m.id === menuId
          ? {
              ...m,
              submenus: m.submenus.map((s) =>
                s.id === submenuId ? { ...s, [field]: value } : s
              ),
            }
          : m
      )
    );
  };

  const moveMenu = (index, direction) => {
    const newMenus = [...menus];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= menus.length) return;
    [newMenus[index], newMenus[newIndex]] = [newMenus[newIndex], newMenus[index]];
    setMenus(newMenus);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="admin-layout p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Menu Management</h1>
              <p className="text-gray-600">Customize navigation menus and submenus</p>
            </div>
            <button
              onClick={saveMenus}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50"
            >
              {saving ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                <FiSave className="w-5 h-5" />
              )}
              Save Changes
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add New Menu */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiPlus className="w-5 h-5 text-primary" />
                  Add New Menu
                </h2>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMenuName}
                    onChange={(e) => setNewMenuName(e.target.value)}
                    placeholder="Menu name (e.g., Technology)"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    onKeyPress={(e) => e.key === "Enter" && addMenu()}
                  />
                  <button
                    onClick={addMenu}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition"
                  >
                    Add Menu
                  </button>
                </div>
              </div>

              {/* Existing Menus */}
              {menus.map((menu, menuIndex) => (
                <motion.div
                  key={menu.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Menu Header */}
                  <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiMenu className="w-5 h-5 text-gray-400" />
                      {editingMenu === menu.id ? (
                        <input
                          type="text"
                          value={menu.name}
                          onChange={(e) => updateMenuName(menu.id, e.target.value)}
                          className="px-3 py-1 border rounded-lg"
                          onBlur={() => setEditingMenu(null)}
                          autoFocus
                        />
                      ) : (
                        <h3 className="text-lg font-bold text-gray-800">{menu.name}</h3>
                      )}
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {menu.submenus.length} items
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveMenu(menuIndex, "up")}
                        disabled={menuIndex === 0}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                      >
                        <FiChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveMenu(menuIndex, "down")}
                        disabled={menuIndex === menus.length - 1}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                      >
                        <FiChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingMenu(menu.id)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedMenu(expandedMenu === menu.id ? null : menu.id)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      >
                        {expandedMenu === menu.id ? (
                          <FiChevronUp className="w-4 h-4" />
                        ) : (
                          <FiChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteMenu(menu.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Submenus */}
                  {(expandedMenu === menu.id || true) && (
                    <div className="p-4">
                      {/* Add Submenu */}
                      <div className="flex gap-3 mb-4">
                        <input
                          type="text"
                          value={expandedMenu === menu.id ? newSubmenuName : ""}
                          onChange={(e) => {
                            setExpandedMenu(menu.id);
                            setNewSubmenuName(e.target.value);
                          }}
                          placeholder="Add submenu item..."
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addSubmenu(menu.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => addSubmenu(menu.id)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Submenu List */}
                      <div className="space-y-2">
                        {menu.submenus.map((submenu) => (
                          <div
                            key={submenu.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                          >
                            <input
                              type="text"
                              value={submenu.name}
                              onChange={(e) =>
                                updateSubmenu(menu.id, submenu.id, "name", e.target.value)
                              }
                              className="flex-1 px-3 py-1.5 border border-transparent bg-transparent rounded focus:border-gray-200 focus:bg-white text-sm"
                              placeholder="Submenu name"
                            />
                            <input
                              type="text"
                              value={submenu.href}
                              onChange={(e) =>
                                updateSubmenu(menu.id, submenu.id, "href", e.target.value)
                              }
                              className="flex-1 px-3 py-1.5 border border-transparent bg-transparent rounded focus:border-gray-200 focus:bg-white text-sm text-gray-500"
                              placeholder="Link URL"
                            />
                            <button
                              onClick={() => deleteSubmenu(menu.id, submenu.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {menu.submenus.length === 0 && (
                          <p className="text-center py-4 text-gray-400 text-sm">
                            No submenu items. Add one above.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {menus.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl">
                  <FiMenu className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No menus yet. Add your first menu above.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Role-Based Access Control (RBAC) System
 * Defines roles, permissions, and access control utilities
 * 
 * @module lib/rbac
 */

// Define available roles
export const ROLES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  USER: 'USER',
  GUEST: 'GUEST',
};

// Define permissions
export const PERMISSIONS = {
  // User management
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage_roles',
  
  // Content management
  CONTENT_VIEW: 'content:view',
  CONTENT_CREATE: 'content:create',
  CONTENT_EDIT: 'content:edit',
  CONTENT_DELETE: 'content:delete',
  CONTENT_PUBLISH: 'content:publish',
  
  // Blog management
  BLOGS_VIEW: 'blogs:view',
  BLOGS_CREATE: 'blogs:create',
  BLOGS_EDIT: 'blogs:edit',
  BLOGS_DELETE: 'blogs:delete',
  BLOGS_PUBLISH: 'blogs:publish',
  
  // Manga management
  MANGA_VIEW: 'manga:view',
  MANGA_CREATE: 'manga:create',
  MANGA_EDIT: 'manga:edit',
  MANGA_DELETE: 'manga:delete',
  MANGA_PUBLISH: 'manga:publish',
  
  // System settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  
  // Audit logs
  AUDIT_VIEW: 'audit:view',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  
  // Cache management
  CACHE_MANAGE: 'cache:manage',
};

// Role-Permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS),
  ],
  
  [ROLES.EDITOR]: [
    // Content permissions
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_EDIT,
    PERMISSIONS.CONTENT_PUBLISH,
    
    // Blog permissions
    PERMISSIONS.BLOGS_VIEW,
    PERMISSIONS.BLOGS_CREATE,
    PERMISSIONS.BLOGS_EDIT,
    PERMISSIONS.BLOGS_PUBLISH,
    
    // Manga permissions
    PERMISSIONS.MANGA_VIEW,
    PERMISSIONS.MANGA_CREATE,
    PERMISSIONS.MANGA_EDIT,
    PERMISSIONS.MANGA_PUBLISH,
    
    // Limited user view
    PERMISSIONS.USERS_VIEW,
    
    // Analytics
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  
  [ROLES.USER]: [
    // View content only
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.BLOGS_VIEW,
    PERMISSIONS.MANGA_VIEW,
  ],
  
  [ROLES.GUEST]: [
    // Public content only
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.BLOGS_VIEW,
    PERMISSIONS.MANGA_VIEW,
  ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether role has permission
 */
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[ROLES.GUEST];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean} Whether role has any permission
 */
export function hasAnyPermission(role, permissions) {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean} Whether role has all permissions
 */
export function hasAllPermissions(role, permissions) {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} Array of permissions
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[ROLES.GUEST];
}

/**
 * Check if role is admin
 * @param {string} role - User role
 * @returns {boolean} Whether role is admin
 */
export function isAdmin(role) {
  return role === ROLES.ADMIN;
}

/**
 * Check if role is editor or higher
 * @param {string} role - User role
 * @returns {boolean} Whether role is editor or higher
 */
export function isEditorOrHigher(role) {
  return role === ROLES.ADMIN || role === ROLES.EDITOR;
}

/**
 * Middleware to check permission
 * @param {string|string[]} requiredPermissions - Required permission(s)
 * @param {Object} options - Options
 * @returns {Function} Middleware function
 */
export function requirePermission(requiredPermissions, options = {}) {
  const { requireAll = false } = options;
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  return (req, res, next) => {
    const userRole = req.user?.role || ROLES.GUEST;
    
    const hasAccess = requireAll
      ? hasAllPermissions(userRole, permissions)
      : hasAnyPermission(userRole, permissions);
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
        requiredPermissions: permissions,
      });
    }
    
    if (typeof next === 'function') {
      next();
    }
    return true;
  };
}

/**
 * API route wrapper to check permission
 * @param {Function} handler - API route handler
 * @param {string|string[]} requiredPermissions - Required permission(s)
 * @param {Object} options - Options
 * @returns {Function} Wrapped handler
 */
export function withPermission(handler, requiredPermissions, options = {}) {
  return async (req, res) => {
    const userRole = req.user?.role || ROLES.GUEST;
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    
    const hasAccess = options.requireAll
      ? hasAllPermissions(userRole, permissions)
      : hasAnyPermission(userRole, permissions);
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
      });
    }
    
    return handler(req, res);
  };
}

/**
 * Get role hierarchy level (higher = more permissions)
 * @param {string} role - User role
 * @returns {number} Hierarchy level
 */
export function getRoleLevel(role) {
  const levels = {
    [ROLES.ADMIN]: 100,
    [ROLES.EDITOR]: 50,
    [ROLES.USER]: 10,
    [ROLES.GUEST]: 0,
  };
  return levels[role] || 0;
}

/**
 * Check if a role can manage another role
 * @param {string} managerRole - Role of manager
 * @param {string} targetRole - Role being managed
 * @returns {boolean} Whether manager can manage target
 */
export function canManageRole(managerRole, targetRole) {
  // Only admins can manage roles
  if (managerRole !== ROLES.ADMIN) return false;
  // Admins can't demote other admins (need super admin)
  if (targetRole === ROLES.ADMIN) return false;
  return true;
}

export default {
  ROLES,
  PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  isAdmin,
  isEditorOrHigher,
  requirePermission,
  withPermission,
  getRoleLevel,
  canManageRole,
};

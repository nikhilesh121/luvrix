// Local auth module for JWT-based authentication
// This provides a compatible interface for components that need auth.currentUser

const TOKEN_KEY = 'luvrix_auth_token';

// Create an auth object that provides currentUser functionality
class LocalAuth {
  constructor() {
    this._currentUser = null;
    this._listeners = [];
    this._initialized = false;
  }

  get currentUser() {
    // Try to get user from localStorage on first access
    if (!this._initialized && typeof window !== 'undefined') {
      this._initializeFromStorage();
    }
    // Attach getIdToken method to currentUser if it exists
    if (this._currentUser && !this._currentUser.getIdToken) {
      this._currentUser.getIdToken = () => {
        if (typeof window !== 'undefined') {
          return Promise.resolve(localStorage.getItem(TOKEN_KEY));
        }
        return Promise.resolve(null);
      };
    }
    return this._currentUser;
  }

  set currentUser(user) {
    this._currentUser = user;
    this._notifyListeners();
  }

  _initializeFromStorage() {
    this._initialized = true;
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userData = localStorage.getItem('luvrix_user_data');
      if (token && userData) {
        this._currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error initializing auth from storage:', error);
    }
  }

  // Update the current user (called from AuthContext)
  updateUser(user) {
    this._currentUser = user;
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('luvrix_user_data', JSON.stringify(user));
      } else {
        localStorage.removeItem('luvrix_user_data');
      }
    }
    this._notifyListeners();
  }

  // Subscribe to auth state changes
  onAuthStateChanged(callback) {
    this._listeners.push(callback);
    // Call immediately with current state
    if (this._initialized || typeof window === 'undefined') {
      callback(this._currentUser);
    } else {
      this._initializeFromStorage();
      callback(this._currentUser);
    }
    // Return unsubscribe function
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback);
    };
  }

  _notifyListeners() {
    this._listeners.forEach(callback => callback(this._currentUser));
  }
}

// Export singleton instance
export const auth = new LocalAuth();

// Export helper to update auth from AuthContext
export const updateAuthUser = (user) => {
  auth.updateUser(user);
};

export default auth;

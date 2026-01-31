import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext({});

const TOKEN_KEY = 'luvrix_auth_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setUserData(data.user);
      } else {
        // Token invalid, remove it
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setUserData(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
        setUserData(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  }, []);

  const register = useCallback(async (email, password, additionalData = {}) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...additionalData }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
        setUserData(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setUserData(null);
    return { success: true };
  }, []);

  const refreshUserData = useCallback(async () => {
    await checkAuthStatus();
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  const value = {
    user,
    userData,
    loading,
    isAdmin: userData?.role === "ADMIN",
    isLoggedIn: !!user,
    login,
    register,
    logout,
    refreshUserData,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;

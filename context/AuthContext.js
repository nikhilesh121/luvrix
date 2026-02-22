import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch additional user data from Firestore
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...data,
            });
          } else {
            // User exists in Auth but not in Firestore — create basic profile
            setUserData({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: "user",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: "user",
          });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Fetch user data from Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userInfo = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: "user",
      };
      
      if (userDoc.exists()) {
        userInfo = { ...userInfo, ...userDoc.data() };
      }
      
      return { success: true, user: userInfo };
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Invalid email or password";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (email, password, additionalData = {}) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Create user document in Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userProfile = {
        email: firebaseUser.email.toLowerCase(),
        name: additionalData.name || "",
        role: "user",
        createdAt: serverTimestamp(),
        points: 0,
        freePostsUsed: 0,
        extraPosts: 0,
      };
      
      await setDoc(userDocRef, userProfile);
      
      return {
        success: true,
        user: {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          ...userProfile,
        },
      };
    } catch (error) {
      console.error("Register error:", error);
      let errorMessage = "Registration failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      let errorMessage = "Failed to send reset email";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserData({
          id: user.uid,
          uid: user.uid,
          email: user.email,
          ...userDoc.data(),
        });
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  }, [user]);

  const getToken = useCallback(async () => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }, [user]);

  const value = {
    user,
    userData,
    loading,
    isAdmin: userData?.role === "ADMIN",
    isLoggedIn: !!user,
    login,
    register,
    logout,
    resetPassword,
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

/**
 * Local auth module - Re-exports Firebase auth for compatibility
 * Components that imported from local-auth.js will now use Firebase auth directly
 */
import { auth as firebaseAuth } from "./firebase";

// Re-export Firebase auth as the main auth object
export const auth = firebaseAuth;

// No-op function for backwards compatibility (AuthContext handles this now)
export const updateAuthUser = (user) => {
  // Firebase auth handles state management automatically via onAuthStateChanged
  // This function is kept for backwards compatibility but does nothing
};

export default auth;

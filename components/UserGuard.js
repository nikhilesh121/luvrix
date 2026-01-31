import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function UserGuard({ children }) {
  const router = useRouter();
  const { user, userData, loading, isLoggedIn } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        router.push("/login");
      } else if (userData?.blocked) {
        router.push("/?blocked=true");
      }
    }
  }, [loading, isLoggedIn, userData, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return typeof children === "function" 
    ? children({ user, userData }) 
    : children;
}

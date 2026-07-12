import { createContext, useContext, useState, useCallback } from "react";
import authService from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const { user: loggedInUser } = await authService.login(credentials);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setError(err.message || "Unable to sign in.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // NEW: lets Settings (or anything else) patch the logged-in user after a
  // profile edit, so components reading `user` re-render immediately instead
  // of waiting for the next login/reload. Mirrors what settings.js already
  // writes to localStorage — this just keeps context state in sync with it.
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("transitops_user", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, updateUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

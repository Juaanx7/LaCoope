import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch } from "../services/api";
import { getStoredAuth, saveAuth, clearAuth } from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicializar sesión
  useEffect(() => {
    const stored = getStoredAuth();

    if (!stored) {
      setLoading(false);
      return;
    }

    setToken(stored.token);
  }, []);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
    clearAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    saveAuth(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch("/api/auth/me", { token });
      setUser(data.user);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) {
      refreshMe();
    }
  }, [token, refreshMe]);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
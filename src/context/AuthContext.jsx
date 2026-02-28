import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch } from "../services/api";

const AuthContext = createContext(null);

const SESSION_DURATION = 1000 * 60 * 60 * 8; // 8 horas

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔎 Inicializar sesión
  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem("auth") || "null");

    if (!stored || stored.expiresAt < Date.now()) {
      sessionStorage.removeItem("auth");
      setLoading(false);
      return;
    }

    setToken(stored.token);
  }, []);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
    sessionStorage.removeItem("auth");
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const authData = {
      token: data.token,
      expiresAt: Date.now() + SESSION_DURATION,
    };

    sessionStorage.setItem("auth", JSON.stringify(authData));

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
    if (token) refreshMe();
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
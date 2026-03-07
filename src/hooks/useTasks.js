import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "";
function apiUrl(path) {
  if (path && !path.startsWith("/")) path = "/" + path;
  return API_BASE + path;
}  

function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    p.set(k, v);
  });
  return p.toString();
}

export function useTasks({ area, week, from, to, status, q } = {}) {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const query = useMemo(
    () => qs({ area, week, from, to, status, q }),
    [area, week, from, to, status, q]
  );

  const fetchTasks = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/tareas?${query}`), { signal: ac.signal });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error al cargar tareas");
      setTasks(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchTasks();
    return () => abortRef.current?.abort();
  }, [fetchTasks]);

  const createTask = useCallback(async (payload) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(apiUrl("/api/tareas"), {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Error al crear tarea");
    await fetchTasks();
    return data;
  }, [fetchTasks, token]);

  const updateTask = useCallback(async (id, payload) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(apiUrl(`/api/tareas/${id}`), {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Error al actualizar tarea");
    await fetchTasks();
    return data;
  }, [fetchTasks, token]);

  const patchStatus = useCallback(async (id, status) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(apiUrl(`/api/tareas/${id}/status`), {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Error al cambiar estado");
    await fetchTasks();
    return data;
  }, [fetchTasks, token]);

  const removeTask = useCallback(async (id) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(apiUrl(`/api/tareas/${id}`), { method: "DELETE", headers });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Error al eliminar tarea");
    await fetchTasks();
    return data;
  }, [fetchTasks, token]);

  return { tasks, loading, error, refetch: fetchTasks, createTask, updateTask, patchStatus, removeTask };
}
import { useCallback, useEffect, useMemo, useState } from "react";

function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    p.set(k, v);
  });
  return p.toString();
}

export function useTasks({ area, week, from, to, status, q } = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(() => qs({ area, week, from, to, status, q }), [area, week, from, to, status, q]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tareas?${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al cargar tareas");
      setTasks(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // CRUD helpers
  const createTask = useCallback(async (payload) => {
    const res = await fetch("/api/tareas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Error al crear tarea");
    await fetchTasks();
    return data;
  }, [fetchTasks]);

  const updateTask = useCallback(async (id, payload) => {
    const res = await fetch(`/api/tareas/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Error al actualizar tarea");
    await fetchTasks();
    return data;
  }, [fetchTasks]);

  const patchStatus = useCallback(async (id, status) => {
    const res = await fetch(`/api/tareas/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Error al cambiar estado");
    await fetchTasks();
    return data;
  }, [fetchTasks]);

  const removeTask = useCallback(async (id) => {
    const res = await fetch(`/api/tareas/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Error al eliminar tarea");
    await fetchTasks();
    return data;
  }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks, createTask, updateTask, patchStatus, removeTask };
}
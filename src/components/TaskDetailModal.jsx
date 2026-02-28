import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "../styles/TaskDetailModal.scss";

const STATUS_LABEL = {
  pending: "Pendiente",
  in_progress: "En proceso",
  done: "Finalizada",
};

const PRIORITY_LABEL = {
  low: "Baja",
  med: "Media",
  high: "Alta",
};

const SAVE_STATE = {
  idle: "idle",
  saving: "saving",
  saved: "saved",
  error: "error",
};

export default function TaskDetailModal({ open, taskId, onClose, onUpdated, onDeleted, onSaved }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);

  const [statusSaving, setStatusSaving] = useState(false);
  const [prioritySaving, setPrioritySaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  // ====== Draft editable (auto-save) - Descipcion ======
  const [draftDescription, setDraftDescription] = useState("");
  const lastSavedDescriptionRef = useRef("");
  const saveTimerRef = useRef(null);
  const saveAbortRef = useRef(null);
  const [descSaveState, setDescSaveState] = useState(SAVE_STATE.idle);
  const hadChangesRef = useRef(false);

  // ====== Draft editable (auto-save) - Usuario ======
const [draftClient, setDraftClient] = useState("");
const lastSavedClientRef = useRef("");
const clientTimerRef = useRef(null);
const [clientSaveState, setClientSaveState] = useState(SAVE_STATE.idle);

  const savedToastTimerRef = useRef(null);

  const currentStatus = useMemo(() => (task?.status ? task.status : "pending"), [task]);
  const currentPriority = useMemo(() => (task?.priority ? task.priority : "med"), [task]);

  // ====== Fetch initial task ======
  useEffect(() => {
    if (!open || !taskId) return;

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/tareas/${taskId}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "No se pudo cargar la tarea");

        const doc = json?.data || json;
        setTask(doc);

        // Inicializa draft + snapshot guardado
        const cli = (doc?.client || "").toString();
        setDraftClient(cli);
        lastSavedClientRef.current = cli;
        setClientSaveState(SAVE_STATE.idle);

        const desc = (doc?.description || "").toString();
        setDraftDescription(desc);
        lastSavedDescriptionRef.current = desc;
        hadChangesRef.current = false;
        setDescSaveState(SAVE_STATE.idle);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Error");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [open, taskId]);

  // ====== Helpers ======
  const refetchTask = useCallback(async () => {
    const res = await fetch(`/api/tareas/${taskId}`);
    const json = await res.json();
    const doc = json?.data || json;
    setTask(doc);

    // sincroniza también el draft si el backend trae otro valor
    const desc = (doc?.description || "").toString();
    setDraftDescription(desc);
    lastSavedDescriptionRef.current = desc;
  }, [taskId]);

  const clearTimers = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (savedToastTimerRef.current) {
      clearTimeout(savedToastTimerRef.current);
      savedToastTimerRef.current = null;
    }
  };

  const cancelInFlightSave = () => {
    if (saveAbortRef.current) {
      saveAbortRef.current.abort();
      saveAbortRef.current = null;
    }
  };

  // ====== Save description (PUT) ======
  const saveDescriptionNow = useCallback(
    async (nextDescription, { notifyToast = false } = {}) => {
      if (!taskId) return;

      const trimmed = (nextDescription ?? "").toString();

      if (trimmed === lastSavedDescriptionRef.current) {
        setDescSaveState(SAVE_STATE.idle);
        return;
      }

      clearTimers();
      cancelInFlightSave();

      const controller = new AbortController();
      saveAbortRef.current = controller;

      setDescSaveState(SAVE_STATE.saving);
      setError("");

      try {
        const res = await fetch(`/api/tareas/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: trimmed }),
          signal: controller.signal,
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "No se pudo guardar la descripción");

        const updated = json?.data || json;

        setTask(updated);
        lastSavedDescriptionRef.current = trimmed;
        setDescSaveState(SAVE_STATE.saved);

        onUpdated?.();

        // ✅ Toast SOLO si lo pedimos explícitamente (por ejemplo al cerrar)
        if (notifyToast) onSaved?.();

        savedToastTimerRef.current = setTimeout(() => {
          setDescSaveState(SAVE_STATE.idle);
        }, 1500);
      } catch (e) {
        if (e.name === "AbortError") return;
        setDescSaveState(SAVE_STATE.error);
        setError(e.message || "Error");
      } finally {
        saveAbortRef.current = null;
      }
    },
    [taskId, onUpdated, onSaved]
  );

  const saveClientNow = useCallback(
    async (nextClient, { notifyToast = false } = {}) => {
      if (!taskId) return;

      const trimmed = (nextClient ?? "").toString().trim();

      if (trimmed === lastSavedClientRef.current) {
        setClientSaveState(SAVE_STATE.idle);
        return;
      }

      // cancel timer pendiente
      if (clientTimerRef.current) {
        clearTimeout(clientTimerRef.current);
        clientTimerRef.current = null;
      }

      setClientSaveState(SAVE_STATE.saving);
      setError("");

      try {
        const res = await fetch(`/api/tareas/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client: trimmed }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "No se pudo guardar el cliente");

        const updated = json?.data || json;

        setTask(updated);
        lastSavedClientRef.current = trimmed;
        setClientSaveState(SAVE_STATE.saved);

        onUpdated?.();

        // ✅ toast SOLO si lo pedimos explícitamente (al cerrar)
        if (notifyToast) onSaved?.();

        setTimeout(() => setClientSaveState(SAVE_STATE.idle), 1500);
      } catch (e) {
        setClientSaveState(SAVE_STATE.error);
        setError(e.message || "Error");
      }
    },
    [taskId, onUpdated, onSaved]
  );

  useEffect(() => {
    if (!open || !taskId || loading || !task) return;
    if (draftClient === lastSavedClientRef.current) return;

    if (clientTimerRef.current) clearTimeout(clientTimerRef.current);

    clientTimerRef.current = setTimeout(() => {
      saveClientNow(draftClient); // 👈 sin toast
    }, 600);

    return () => {
      if (clientTimerRef.current) {
        clearTimeout(clientTimerRef.current);
        clientTimerRef.current = null;
      }
    };
  }, [draftClient, open, taskId, loading, task, saveClientNow]);

  // ====== Debounce auto-save al tipear ======
  useEffect(() => {
    if (!open) return;
    if (!taskId) return;
    if (loading) return;
    if (!task) return;
    if (draftDescription === lastSavedDescriptionRef.current) return;

    clearTimers();

    saveTimerRef.current = setTimeout(() => {
      saveDescriptionNow(draftDescription);
    }, 600);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [draftDescription, open, taskId, loading, task, saveDescriptionNow]);

  // ====== Status change (PATCH) ======
  const handleStatusChange = async (newStatus) => {
    if (!taskId) return;

    setTask((prev) => (prev ? { ...prev, status: newStatus } : prev));
    setStatusSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/tareas/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "No se pudo actualizar el estado");

      setTask(json?.data || json);
      onUpdated?.();
    } catch (e) {
      try {
        await refetchTask();
      } catch {}
      setError(e.message || "Error");
    } finally {
      setStatusSaving(false);
    }
  };

  // ====== Priority change (PUT) ======
  const handlePriorityChange = async (newPriority) => {
    if (!taskId) return;

    setTask((prev) => (prev ? { ...prev, priority: newPriority } : prev));
    setPrioritySaving(true);
    setError("");

    try {
      const res = await fetch(`/api/tareas/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "No se pudo actualizar la prioridad");

      setTask(json?.data || json);
      onUpdated?.();
    } catch (e) {
      try {
        await refetchTask();
      } catch {}
      setError(e.message || "Error");
    } finally {
      setPrioritySaving(false);
    }
  };

  // ====== Delete ======
  const handleDelete = async () => {
    if (!taskId) return;

    const ok = window.confirm("¿Eliminar esta tarea? Esta acción no se puede deshacer.");
    if (!ok) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/tareas/${taskId}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "No se pudo eliminar la tarea");

      onDeleted?.();
    } catch (e) {
      setError(e.message || "Error");
    } finally {
      setDeleting(false);
    }
  };

  // ====== Close with autosave backup ======
  const handleClose = async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (clientTimerRef.current) {
      clearTimeout(clientTimerRef.current);
      clientTimerRef.current = null;
    }

    const dirtyDesc = draftDescription !== lastSavedDescriptionRef.current;
    const dirtyClient = draftClient !== lastSavedClientRef.current;

    if (dirtyDesc) {
      await saveDescriptionNow(draftDescription, { notifyToast: false });
      if (draftDescription !== lastSavedDescriptionRef.current) return;
    }

    if (dirtyClient) {
      await saveClientNow(draftClient, { notifyToast: false });
      if (draftClient !== lastSavedClientRef.current) return;
    }

    if (dirtyDesc || dirtyClient) onSaved?.();
    onClose?.();
  };


  // cleanup cuando se desmonta / se cierra
  useEffect(() => {
    if (!open) {
      clearTimers();
      cancelInFlightSave();
    }
    return () => {
      clearTimers();
      cancelInFlightSave();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="tdm-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="tdm-modal">
        {/* Header */}
        <div className="tdm-header">
          <div className="tdm-header__left">
            <div className="tdm-kicker">Detalle de tarea</div>
            <div className="tdm-title">{loading ? "Cargando…" : task?.title || "—"}</div>
          </div>
          <span className={`tdm-badge status--${currentStatus}`} title="Estado actual">
            {STATUS_LABEL[currentStatus] || currentStatus}
          </span>

          <span className={`tdm-badge priority--${currentPriority}`} title="Prioridad">
            {PRIORITY_LABEL[currentPriority] || currentPriority}
          </span>

          <button className="tdm-close" onClick={handleClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="tdm-body">
          {error ? <div className="tdm-error">{error}</div> : null}

          {loading ? (
            <div className="tdm-muted">Cargando datos…</div>
          ) : !task ? (
            <div className="tdm-muted">No se encontró la tarea.</div>
          ) : (
            <div className="tdm-grid">
              <div className="tdm-section">
                <div className="tdm-label">Cliente</div>

                <input
                  className="tdm-input"
                  value={draftClient}
                  onChange={(e) => setDraftClient(e.target.value)}
                  placeholder="Apellido y nombre / N° cuenta…"
                />

                <div className="tdm-savebar">
                  {clientSaveState === SAVE_STATE.saving ? (
                    <span className="tdm-saving">Guardando…</span>
                  ) : clientSaveState === SAVE_STATE.saved ? (
                    <span className="tdm-saved">Cambios guardados ✓</span>
                  ) : clientSaveState === SAVE_STATE.error ? (
                    <span className="tdm-saveerror">Error al guardar</span>
                  ) : (
                    <span className="tdm-muted">
                      {draftClient !== lastSavedClientRef.current ? "Cambios sin guardar…" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Estado */}
              <div className="tdm-section">
                <div className="tdm-label">Estado</div>
                <div className="tdm-row">
                  <select
                    className="tdm-select"
                    value={currentStatus}
                    disabled={statusSaving}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En proceso</option>
                    <option value="done">Finalizada</option>
                  </select>

                  <span className="tdm-hint">{statusSaving ? "Guardando…" : "Cambiá el estado desde acá."}</span>
                </div>
              </div>

              {/* Prioridad */}
              <div className="tdm-section">
                <div className="tdm-label">Prioridad</div>
                <div className="tdm-row">
                  <select
                    className="tdm-select"
                    value={currentPriority}
                    disabled={prioritySaving}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                  >
                    <option value="low">Baja</option>
                    <option value="med">Media</option>
                    <option value="high">Alta</option>
                  </select>

                  <span className="tdm-hint">
                    {prioritySaving ? "Guardando…" : `Actual: ${PRIORITY_LABEL[currentPriority] || currentPriority}`}
                  </span>
                </div>
              </div>

              {/* Descripción editable + autosave feedback */}
              <div className="tdm-section">
                <div className="tdm-label">Descripción</div>

                <textarea
                  className="tdm-textarea"
                  value={draftDescription}
                  onChange={(e) => {
                    hadChangesRef.current = true;
                    setDraftDescription(e.target.value);
                  }}
                  placeholder="Escribí una descripción…"
                  rows={4}
                />

                <div className="tdm-savebar">
                  {descSaveState === SAVE_STATE.saving ? (
                    <span className="tdm-saving">Guardando…</span>
                  ) : descSaveState === SAVE_STATE.saved ? (
                    <span className="tdm-saved">Cambios guardados ✓</span>
                  ) : descSaveState === SAVE_STATE.error ? (
                    <span className="tdm-saveerror">Error al guardar</span>
                  ) : (
                    <span className="tdm-muted">{draftDescription !== lastSavedDescriptionRef.current ? "Cambios sin guardar…" : ""}</span>
                  )}
                </div>
              </div>

              {/* Área / Fecha */}
              <div className="tdm-two">
                <div className="tdm-section">
                  <div className="tdm-label">Área</div>
                  <div className="tdm-field">{task.area || "—"}</div>
                </div>

                <div className="tdm-section">
                  <div className="tdm-label">Fecha</div>
                  <div className="tdm-field">
                    {task.fechaSemana || (task.date ? String(task.date).slice(0, 10) : "—")}
                  </div>
                </div>
              </div>

              {/* Notas (solo lectura por ahora) */}
              <div className="tdm-section">
                <div className="tdm-label">Notas</div>
                <div className="tdm-box">{task.notes?.trim() ? task.notes : "—"}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="tdm-footer">
          <button className="tdm-btn tdm-btn--danger" onClick={handleDelete} disabled={deleting || loading}>
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>

          <button className="tdm-btn tdm-btn--ghost" onClick={handleClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
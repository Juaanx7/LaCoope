import { useEffect, useMemo, useState } from "react";
import "../styles/TaskModal.scss";

const PRIORIDADES = [
  { value: "low", label: "Baja" },
  { value: "med", label: "Media" },
  { value: "high", label: "Alta" },
];

export default function TaskModal({
  open,
  onClose,
  onSubmit,
  defaultDateYMD,
  area,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cliente, setCliente] = useState("");
  const [priority, setPriority] = useState("med");
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  useEffect(() => {
    if (!open) return;

    // reset al abrir
    setTitle("");
    setDescription("");
    setCliente("");
    setPriority("med");
    setSaving(false);

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSave || saving) return;

    setSaving(true);
    try {
      await onSubmit?.({
        title: title.trim(),
        description: description.trim(),
        client: cliente.trim(),
        priority,
        notes: "",
        area,
        date: defaultDateYMD,
      });

      onClose?.();
    } catch (err) {
      alert(err?.message || "Error al crear la tarea");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tm-backdrop" onMouseDown={onClose}>
      <div className="tm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="tm-header">
          <h3>Nueva tarea</h3>
          <button
            type="button"
            className="tm-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="tm-meta">
          <span><strong>Área:</strong> {area}</span>
          <span><strong>Fecha:</strong> {defaultDateYMD}</span>
        </div>

        <form onSubmit={handleSubmit} className="tm-form">
          <label>
            Trabajo (título) *
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Instalación de módem / Reclamo / Visita técnica…"
            />
          </label>

          <label>
            Descripción
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles del trabajo…"
              rows={3}
            />
          </label>

          <label>
            Cliente
            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Apellido y nombre / N° cuenta…"
            />
          </label>

          <label>
            Prioridad
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <div className="tm-actions">
            <button
              type="button"
              className="tm-btn ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="tm-btn primary"
              disabled={!canSave || saving}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
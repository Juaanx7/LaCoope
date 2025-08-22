import { useMemo, useState, useCallback, useRef } from "react";
import "../styles/Tareas.scss";
import { useNavigate } from "react-router-dom";
import { useArea } from "../context/AreaContext";
import { useTasks } from "../hooks/useTasks";
import {
  DndContext,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// --- helpers de fechas ---
function startOfISOWeek(date = new Date()) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // lunes=0..domingo=6
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day); // lunes
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function toYMD(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function getISOWeekStr(dateInput = new Date()) {
  const d = new Date(dateInput);
  const day = (d.getDay() + 6) % 7; // lunes=0..domingo=6
  d.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstThursdayDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDay + 3);
  const weekNo = 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
  const year = d.getFullYear();
  return `${year}-W${String(weekNo).padStart(2, "0")}`;
}

// --- mapeos de estado (interno -> UI) ---
const nextStatus = { pending: "in_progress", in_progress: "done", done: "pending" };
const statusLabel = { pending: "pendiente", in_progress: "en proceso", done: "finalizada" };
const statusClass = { pending: "pendiente", in_progress: "en proceso", done: "finalizada" };

// --- DnD wrappers ---
function DroppableColumn({ id, children }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`dia ${isOver ? "over" : ""}`}>
      {children}
    </div>
  );
}

// Draggable “desde toda la card”
function DraggableCard({ id, children }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return children({
    setNodeRef,
    isDragging,
    dragProps: { ...listeners, ...attributes }, // ← se aplican a la card completa
  });
}

export default function Tareas() {
  const navigate = useNavigate();
  const { area } = useArea();

  // lunes de la semana actual
  const [anchorDate, setAnchorDate] = useState(() => startOfISOWeek(new Date()));
  const week = useMemo(() => getISOWeekStr(anchorDate), [anchorDate]);

  // estado del form
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [diaSeleccionado, setDiaSeleccionado] = useState("");

  // DnD: umbral y delay para no iniciar drag con un click normal
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8, delay: 120, tolerance: 6 } })
  );

  // fetch de tareas por área+semana ISO
  const { tasks, loading, error, createTask, patchStatus, removeTask, updateTask } = useTasks({
    area,
    week,
  });

  // activeId para overlay
  const [activeId, setActiveId] = useState(null);
  const activeTask = useMemo(() => tasks.find((t) => t._id === activeId), [tasks, activeId]);

  // Agrupa por día (0..4) con diferencia de fechas respecto al lunes ancla
  const tareasPorDia = useMemo(() => {
    const map = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    const base = new Date(anchorDate);
    base.setHours(0, 0, 0, 0);

    (tasks || []).forEach((t) => {
      const ymd = t.fechaSemana || (t.date && String(t.date).slice(0, 10));
      if (!ymd) return;
      const [y, m, d] = ymd.split("-").map(Number);
      const localDate = new Date(y, m - 1, d);
      localDate.setHours(0, 0, 0, 0);

      const idx = Math.round((localDate - base) / 86400000);
      if (idx >= 0 && idx <= 4) map[idx].push(t);
    });
    return map;
  }, [tasks, anchorDate]);

  const handleAgregar = async (diaIdx) => {
    if (!nuevaTarea.trim()) return;
    const ymd = toYMD(addDays(anchorDate, diaIdx));
    try {
      await createTask({ title: nuevaTarea.trim(), area, date: ymd });
      setNuevaTarea("");
      setDiaSeleccionado("");
    } catch (e) {
      alert(e.message || "Error al crear tarea");
    }
  };

  const handleCambiarEstado = async (t) => {
    const next = nextStatus[t.status] || "pending";
    try {
      await patchStatus(t._id, next);
    } catch (e) {
      alert(e.message || "Error al cambiar estado");
    }
  };

  // ---- Evitar “salto” del contenedor semanal: bloquear altura durante drag ----
  const semanaRef = useRef(null);
  const lockHeight = useCallback(() => {
    const el = semanaRef.current;
    if (!el) return;
    // fija la altura actual para que no se recalculen layouts al volar la tarjeta
    el.style.height = `${el.offsetHeight}px`;
  }, []);
  const unlockHeight = useCallback(() => {
    const el = semanaRef.current;
    if (!el) return;
    el.style.height = "";
  }, []);

  // --- DnD: mover entre días ---
  const onDragStart = useCallback(({ active }) => {
    setActiveId(active.id);
    lockHeight();
  }, [lockHeight]);

  const onDragCancel = useCallback(() => {
    setActiveId(null);
    unlockHeight();
  }, [unlockHeight]);

  const onDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveId(null);
      unlockHeight();
      if (!over) return;
      const taskId = active.id;
      const dropId = over.id;
      if (!String(dropId).startsWith("day-")) return;
      const dayIdx = Number(String(dropId).split("-")[1] || 0);
      const newDate = toYMD(addDays(anchorDate, dayIdx));
      try {
        await updateTask(taskId, { date: newDate });
      } catch (e) {
        alert(e.message || "No se pudo mover la tarea");
      }
    },
    [anchorDate, updateTask, unlockHeight]
  );

  return (
    <div className="tareas-container">
      <h1>🛠️ Trabajos Diarios</h1>

      <div className="acciones-superior" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <button className="btn-historial" onClick={() => navigate("/historial")}>
          📅 Ver historial mensual
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setAnchorDate(addDays(anchorDate, -7))}>⟵ Semana</button>
          <strong>{week} — {area}</strong>
          <button onClick={() => setAnchorDate(addDays(anchorDate, +7))}>Semana ⟶</button>
          <button onClick={() => setAnchorDate(startOfISOWeek(new Date()))}>Hoy</button>
        </div>
      </div>

      {loading && <p>Cargando tareas…</p>}
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="semana" ref={semanaRef}>
          {diasSemana.map((dia, idx) => (
            <DroppableColumn key={dia} id={`day-${idx}`}>
              <h3>{dia}</h3>

              {(tareasPorDia[idx] || []).map((t) => {
                const claseEstado = statusClass[t.status] || "pendiente";
                return (
                  <DraggableCard key={t._id} id={t._id}>
                    {({ setNodeRef, isDragging, dragProps }) => (
                      <div
                        ref={setNodeRef}
                        // Drag desde cualquier parte de la card:
                        {...dragProps}
                        // Si el click es en un elemento interactivo, no arrastrar:
                        onPointerDownCapture={(e) => {
                          if (e.target.closest("[data-no-dnd]")) e.stopPropagation();
                        }}
                        // Oculta el original durante el drag, pero manteniendo su espacio:
                        style={{ visibility: isDragging ? "hidden" : "visible", userSelect: "none" }}
                        className={`tarea ${claseEstado}`}
                        onClick={() => handleCambiarEstado(t)}
                        title="Mantené presionado o arrastrá para mover. Click para cambiar estado."
                      >
                        <div className="tarea-titulo">{t.title}</div>
                        {t.description && <div className="tarea-desc">{t.description}</div>}

                        <div className="tarea-footer">
                          <span className="estado">({statusLabel[t.status] || t.status})</span>
                          <button
                            className="btn-eliminar"
                            data-no-dnd
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTask(t._id).catch((err) => alert(err.message));
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </DraggableCard>
                );
              })}

              {diaSeleccionado === dia ? (
                <div className="form-nueva-tarea">
                  <input
                    type="text"
                    value={nuevaTarea}
                    onChange={(e) => setNuevaTarea(e.target.value)}
                    placeholder="Descripción..."
                  />
                  <button onClick={() => handleAgregar(idx)}>Guardar</button>
                  <button
                    className="btn-cancelar"
                    onClick={() => {
                      setNuevaTarea("");
                      setDiaSeleccionado("");
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button onClick={() => setDiaSeleccionado(dia)}>+ Nueva Tarea</button>
              )}
            </DroppableColumn>
          ))}
        </div>

        {/* Clon “volador” para el drag (evita reflujo) */}
        <DragOverlay>
          {activeTask ? (
            <div className={`tarea ${statusClass[activeTask.status] || "pendiente"} dragging`}>
              <div className="tarea-titulo">{activeTask.title}</div>
              {activeTask.description && <div className="tarea-desc">{activeTask.description}</div>}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
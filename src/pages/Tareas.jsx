import { useMemo, useState, useCallback, useRef } from "react";
import "../styles/Tareas.scss";
import { useNavigate } from "react-router-dom";
import { useArea } from "../context/AreaContext";
import { useTasks } from "../hooks/useTasks";
import TaskModal from "../components/TaskModal";
import TaskDetailModal from "../components/TaskDetailModal";
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
const statusLabel = { pending: "pendiente", in_progress: "en proceso", done: "finalizada" };
const statusClass = { pending: "pendiente", in_progress: "en-proceso", done: "finalizada" };

// --- DnD wrappers ---
function DroppableColumn({ id, children }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`dia ${isOver ? "over" : ""}`}>
      {children}
    </div>
  );
}
function DraggableCard({ id, children }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return children({
    setNodeRef,
    isDragging,
    dragProps: { ...listeners, ...attributes },
  });
}

// Extrae el cliente de la tarea (campo client o notas)
function getCliente(task) {
  if (task?.client && String(task.client).trim()) return String(task.client).trim();

  const notes = task?.notes || "";
  const line = String(notes)
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.toLowerCase().startsWith("cliente:"));

  return line ? line.split(":").slice(1).join(":").trim() : "";
}

export default function Tareas() {
  const navigate = useNavigate();
  const { area } = useArea();

  // toast
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  // semana actual
  const [anchorDate, setAnchorDate] = useState(() => startOfISOWeek(new Date()));
  const week = useMemo(() => getISOWeekStr(anchorDate), [anchorDate]);

  // modal creación
  const [modalOpen, setModalOpen] = useState(false);
  const [dayIdxForNew, setDayIdxForNew] = useState(null);

  // modal detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);

  // bandera anti “click al soltar drag”
  const [wasDragging, setWasDragging] = useState(false);

  // DnD: activación más fluida
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3, tolerance: 6 } })
  );

  // fetch de tareas por área+semana ISO
  const { tasks, loading, error, createTask, updateTask, refetch } = useTasks({
    area,
    week,
  });

  // activeId para overlay
  const [activeId, setActiveId] = useState(null);
  const activeTask = useMemo(() => tasks.find((t) => t._id === activeId), [tasks, activeId]);

  // Agrupa por día (0..4)
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

  // ---- Evitar “salto” del contenedor semanal: bloquear altura durante drag ----
  const semanaRef = useRef(null);
  const lockHeight = useCallback(() => {
    const el = semanaRef.current;
    if (!el) return;
    el.style.height = `${el.offsetHeight}px`;
  }, []);
  const unlockHeight = useCallback(() => {
    const el = semanaRef.current;
    if (!el) return;
    el.style.height = "";
  }, []);

  // --- DnD handlers ---
  const onDragStart = useCallback(
    ({ active }) => {
      setActiveId(active.id);
      setWasDragging(true);
      lockHeight();
    },
    [lockHeight]
  );

  const onDragCancel = useCallback(() => {
    setActiveId(null);
    unlockHeight();
    setTimeout(() => setWasDragging(false), 0);
  }, [unlockHeight]);

  const onDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;

      setActiveId(null);
      unlockHeight();
      setTimeout(() => setWasDragging(false), 0);

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
    <div className="page tareas">
        <div className="page__header">
          <div>
            <h1 className="page__title">Trabajos semanales</h1>
            <p className="page__subtitle">Organizá y mové tareas por día con drag & drop.</p>
          </div>

          <div className="page__actions">
            <button className="btn btn--ghost" onClick={() => navigate("/historial")}>
              📅 Historial mensual
            </button>

            <div className="weekNav">
              <button className="btn btn--soft" onClick={() => setAnchorDate(addDays(anchorDate, -7))}>
                ⟵ Semana
              </button>

              <div className="weekNav__label">
                <strong>{week}</strong>
                <span className="weekNav__area">{area}</span>
              </div>

              <button className="btn btn--soft" onClick={() => setAnchorDate(addDays(anchorDate, +7))}>
                Semana ⟶
              </button>

              <button className="btn btn--primary" onClick={() => setAnchorDate(startOfISOWeek(new Date()))}>
                Hoy
              </button>
            </div>
          </div>
        </div>

      {loading && <div className="alert alert--info">Cargando tareas…</div>}
      {error && <div className="alert alert--danger">Error: {error}</div>}

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
                const cliente = getCliente(t);

                return (
                  <DraggableCard key={t._id} id={t._id}>
                    {({ setNodeRef, isDragging, dragProps }) => (
                      <div
                        ref={setNodeRef}
                        {...dragProps}
                        onPointerDownCapture={(e) => {
                          if (e.target.closest("[data-no-dnd]")) e.stopPropagation();
                        }}
                        style={{ visibility: isDragging ? "hidden" : "visible", userSelect: "none" }}
                        className={`tarea ${claseEstado}`}
                        onClick={() => {
                          if (wasDragging) return;
                          setDetailId(t._id);
                          setDetailOpen(true);
                        }}
                        title="Click para ver detalle. Arrastrá para mover."
                      >
                        <div className="tarea-titulo">{t.title}</div>

                        {cliente ? <div className="tarea-sub">{cliente}</div> : null}

                        <div className="tarea-footer">
                          <span className="estado">({statusLabel[t.status] || t.status})</span>
                        </div>
                      </div>
                    )}
                  </DraggableCard>
                );
              })}

              <button
                onClick={() => {
                  setDayIdxForNew(idx);
                  setModalOpen(true);
                }}
              >
                + Nueva Tarea
              </button>
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className={`tarea ${statusClass[activeTask.status] || "pendiente"} dragging`}>
              <div className="tarea-titulo">{activeTask.title}</div>
              {activeTask.description && <div className="tarea-desc">{activeTask.description}</div>}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modal crear */}
      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        area={area}
        defaultDateYMD={toYMD(addDays(anchorDate, dayIdxForNew ?? 0))}
        onSubmit={async (payload) => {
          await createTask(payload);
        }}
      />

      {/* Modal detalle */}
      <TaskDetailModal
        open={detailOpen}
        taskId={detailId}
        onClose={() => {
          setDetailOpen(false);
          setDetailId(null);
        }}
        onUpdated={refetch}
        onDeleted={() => {
          setDetailOpen(false);
          setDetailId(null);
          refetch();
        }}
        onSaved={() => showToast("Cambios guardados ✓")}
      />

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
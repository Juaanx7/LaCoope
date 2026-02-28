import { useState, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/HistorialTareas.scss";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useArea } from "../context/AreaContext";

// ---------- helpers ----------
function toYMD(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function monthRange(date) {
  const d = new Date(date);
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: toYMD(from), to: toYMD(to) };
}
function parseDateLikeLocal(d) {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  return new Date(d);
}

const statusLabel = { pending: "pendiente", in_progress: "en proceso", done: "finalizada" };
const statusClass = { pending: "pendiente", in_progress: "en proceso", done: "finalizada" };

function getStatusLabel(task) {
  const raw = task.status || task.estado || "pending";
  const norm = String(raw).toLowerCase().replace(/\s+/g, "_");
  return statusLabel[norm] || raw;
}
function getStatusClass(task) {
  const raw = task.status || task.estado || "pending";
  const norm = String(raw).toLowerCase().replace(/\s+/g, "_");
  return statusClass[norm] || raw;
}
function getDateISO(task) {
  // preferimos fechaSemana (ya la generás en el model)
  if (task.fechaSemana) return task.fechaSemana;
  if (task.date) {
    const d = parseDateLikeLocal(task.date);
    return d ? toYMD(d) : undefined;
  }
  return undefined;
}
function dayNameEs(date) {
  try {
    return new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(date);
  } catch {
    const names = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    return names[date.getDay()];
  }
}

function HistorialTareas() {
  const navigate = useNavigate();
  const { area } = useArea();

  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [tareasDelDia, setTareasDelDia] = useState([]);
  const [fechasConTareas, setFechasConTareas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);

  const fechaISO = useMemo(() => toYMD(fechaSeleccionada), [fechaSeleccionada]);
  const { from: monthFrom, to: monthTo } = useMemo(() => monthRange(fechaSeleccionada), [fechaSeleccionada]);

  const esFuturo = new Date(fechaSeleccionada) > new Date();

  // ✅ Obtener tareas del día con from/to
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/tareas?area=${area}&from=${fechaISO}&to=${fechaISO}`, {
          signal: controller.signal,
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || "Error al cargar tareas del día");
        const list = Array.isArray(json) ? json : json?.data || [];
        setTareasDelDia(list);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error al cargar tareas del día:", err);
          setTareasDelDia([]);
        }
      }
    })();
    return () => controller.abort();
  }, [fechaISO, area]);

  // ✅ Fechas con tareas: pedimos todas las del mes y generamos el set de fechas
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/tareas?area=${area}&from=${monthFrom}&to=${monthTo}`, {
          signal: controller.signal,
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || "Error al cargar tareas del mes");
        const list = Array.isArray(json) ? json : json?.data || [];

        const set = new Set();
        list.forEach((t) => {
          const iso = getDateISO(t);
          if (iso) set.add(iso);
        });

        setFechasConTareas(Array.from(set));
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error al obtener fechas con tareas:", err);
          setFechasConTareas([]);
        }
      }
    })();
    return () => controller.abort();
  }, [monthFrom, monthTo, area]);

  // ✅ Exportar PDF por rango usando from/to
  const exportarPDF = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert("Por favor seleccioná ambas fechas.");
      return;
    }
    const desde = toYMD(fechaDesde);
    const hasta = toYMD(fechaHasta);

    try {
      const res = await fetch(`/api/tareas?area=${area}&from=${desde}&to=${hasta}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Error al obtener tareas del rango");
      const list = Array.isArray(json) ? json : json?.data || [];

      const doc = new jsPDF();
      doc.text(`Historial de Tareas — ${area}`, 14, 15);

      const rows = list.map((t) => {
        const iso = getDateISO(t) || "";
        const d = iso ? parseDateLikeLocal(iso) : parseDateLikeLocal(t.date);
        const diaNombre = d ? dayNameEs(d) : "";
        const desc = t.descripcion || t.description || t.title || "";
        const estado = getStatusLabel(t);
        return [iso, diaNombre, desc, estado];
      });

      autoTable(doc, {
        head: [["Fecha", "Día", "Descripción", "Estado"]],
        body: rows,
        startY: 25,
      });

      doc.save(`Historial_Tareas_${area}_${desde}_a_${hasta}.pdf`);
      setMostrarModal(false);
    } catch (err) {
      console.error("Error al exportar tareas:", err);
      alert(err.message || "Ocurrió un error al exportar.");
    }
  };

  return (
    <div className="page historial">
      <div className="page__header">
        <div>
          <h1 className="page__title">Historial de tareas</h1>
          <p className="page__subtitle">Seleccioná un día y revisá lo realizado. Podés exportar por rango.</p>
        </div>

        <div className="page__actions">
          <button onClick={() => navigate("/")} className="btn btn--ghost">
            Volver
          </button>
          <button onClick={() => setMostrarModal(true)} className="btn btn--primary">
            📤 Exportar
          </button>
        </div>
      </div>

      <div className="historial__grid">
        <div className="card card--calendar">
          <div className="card__title">Calendario</div>

          <DatePicker
            selected={fechaSeleccionada}
            onChange={(date) => setFechaSeleccionada(date)}
            dateFormat="yyyy-MM-dd"
            inline
            dayClassName={(date) => {
              const fecha = toYMD(date);
              return fechasConTareas.includes(fecha) ? "con-tarea" : undefined;
            }}
          />
        </div>

        <div className="card card--list">
          <div className="card__title">
            Tareas del {fechaSeleccionada.toLocaleDateString()}
          </div>

          <ul className="tareas-lista">
            {esFuturo ? (
              <li className="empty">📅 Has seleccionado una fecha futura. No hay tareas programadas.</li>
            ) : tareasDelDia.length === 0 ? (
              <li className="empty">🎉 No se registraron tareas para este día.</li>
            ) : (
              tareasDelDia.map((t) => {
                const iso = getDateISO(t);
                const d = iso ? parseDateLikeLocal(iso) : parseDateLikeLocal(t.date);
                const diaNombre = d ? dayNameEs(d) : "";
                const desc = t.descripcion || t.description || t.title || "";
                const estadoLabel = getStatusLabel(t);
                const clase = getStatusClass(t);

                return (
                  <li key={t._id} className={`tarea ${clase}`}>
                    <div className="tarea__top">
                      <strong>{diaNombre}</strong>
                      <span className={`pill pill--${clase}`}>{estadoLabel}</span>
                    </div>
                    <div className="tarea__desc">{desc}</div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      {mostrarModal && (
        <div className="hm-backdrop" onMouseDown={() => setMostrarModal(false)}>
          <div className="hm-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="hm-header">
              <h3>Exportar historial</h3>
              <button className="hm-close" onClick={() => setMostrarModal(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="hm-body">
              <label>Desde</label>
              <DatePicker selected={fechaDesde} onChange={(date) => setFechaDesde(date)} dateFormat="yyyy-MM-dd" />

              <label>Hasta</label>
              <DatePicker selected={fechaHasta} onChange={(date) => setFechaHasta(date)} dateFormat="yyyy-MM-dd" />
            </div>

            <div className="hm-actions">
              <button className="btn btn--ghost" onClick={() => setMostrarModal(false)}>
                Cancelar
              </button>
              <button className="btn btn--primary" onClick={exportarPDF}>
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistorialTareas;
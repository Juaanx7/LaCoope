import { useState, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/HistorialTareas.scss";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useArea } from "../context/AreaContext";

// ---------- helpers ----------
function toYMD(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function monthStr(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
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
  // Soporta docs nuevos y legacy
  if (task.fechaSemana) return task.fechaSemana; // "YYYY-MM-DD"
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
    const names = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
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
  const mesISO = useMemo(() => monthStr(fechaSeleccionada), [fechaSeleccionada]);
  const esFuturo = new Date(fechaSeleccionada) > new Date();

  // ✅ Obtener tareas del día (compat: ?semana=YYYY-MM-DD) + filtro área
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/tareas?semana=${fechaISO}&area=${area}`, { signal: controller.signal });
        const data = await res.json();
        setTareasDelDia(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error al cargar tareas del día:", err);
          setTareasDelDia([]);
        }
      }
    })();
    return () => controller.abort();
  }, [fechaISO, area]);

  // ✅ Obtener fechas con tareas para resaltar (compat) + filtro área
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/tareas/fechas-con-tareas?mes=${mesISO}&area=${area}`, { signal: controller.signal });
        const data = await res.json();
        setFechasConTareas(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error al obtener fechas con tareas:", err);
          setFechasConTareas([]);
        }
      }
    })();
    return () => controller.abort();
  }, [mesISO, area]);

  // ✅ Exportar a PDF por rango (usa /rango con área)
  const exportarPDF = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert("Por favor seleccioná ambas fechas.");
      return;
    }
    const desde = toYMD(fechaDesde);
    const hasta = toYMD(fechaHasta);
    try {
      const res = await fetch(`/api/tareas/rango?desde=${desde}&hasta=${hasta}&area=${area}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      const doc = new jsPDF();
      doc.text(`Historial de Tareas — ${area}`, 14, 15);

      const rows = list.map((t) => {
        const iso = getDateISO(t);
        const d = parseDateLikeLocal(iso || t.date);
        const diaNombre = d ? dayNameEs(d) : "";
        const desc = t.descripcion || t.description || t.title || "";
        const estado = getStatusLabel(t);
        return [iso || "", diaNombre, desc, estado];
      });

      doc.autoTable({
        head: [["Fecha", "Día", "Descripción", "Estado"]],
        body: rows,
        startY: 25,
      });

      doc.save(`Historial_Tareas_${area}_${desde}_a_${hasta}.pdf`);
      setMostrarModal(false);
    } catch (err) {
      console.error("Error al exportar tareas:", err);
      alert("Ocurrió un error al exportar.");
    }
  };

  return (
    <div className="historial-container">
      <h1>📅 Historial de Tareas</h1>

      {/* 📆 Calendario */}
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

      <h2>Tareas del {fechaSeleccionada.toLocaleDateString()}</h2>

      <ul className="tareas-lista">
        {esFuturo ? (
          <p>📅 Has seleccionado una fecha futura. No hay tareas programadas.</p>
        ) : tareasDelDia.length === 0 ? (
          <p>🎉 No se registraron tareas para este día.</p>
        ) : (
          tareasDelDia.map((t) => {
            const iso = getDateISO(t);
            const d = iso ? parseDateLikeLocal(iso) : parseDateLikeLocal(t.date);
            const diaNombre = d ? dayNameEs(d) : t.dia || "";
            const desc = t.descripcion || t.description || t.title || "";
            const estadoLabel = getStatusLabel(t);
            const clase = getStatusClass(t); // genera "pendiente" | "en proceso" | "finalizada"
            return (
              <li key={t._id} className={`tarea ${clase}`}>
                <strong>{diaNombre}:</strong> {desc} — <em>{estadoLabel}</em>
              </li>
            );
          })
        )}
      </ul>

      <div className="botones-acciones">
        <button onClick={() => navigate("/trabajos")} className="btn-volver">
          Volver
        </button>
        <button onClick={() => setMostrarModal(true)} className="btn-exportar">
          📤 Exportar historial
        </button>
      </div>

      {mostrarModal && (
        <div className="modal-exportar">
          <div className="modal-contenido">
            <h3>📆 Seleccionar rango de fechas</h3>
            <label>Desde:</label>
            <DatePicker
              selected={fechaDesde}
              onChange={(date) => setFechaDesde(date)}
              dateFormat="yyyy-MM-dd"
            />
            <label>Hasta:</label>
            <DatePicker
              selected={fechaHasta}
              onChange={(date) => setFechaHasta(date)}
              dateFormat="yyyy-MM-dd"
            />
            <div className="modal-botones">
              <button onClick={exportarPDF}>✅ Exportar</button>
              <button onClick={() => setMostrarModal(false)}>❌ Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistorialTareas;
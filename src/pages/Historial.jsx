import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/HistorialTareas.scss";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";

function HistorialTareas() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [tareasDelDia, setTareasDelDia] = useState([]);
  const [fechasConTareas, setFechasConTareas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);
  const navigate = useNavigate();

  // ✅ Obtener tareas del día
  useEffect(() => {
    const fechaISO = fechaSeleccionada.toISOString().slice(0, 10);

    fetch(`http://localhost:5000/api/tareas?semana=${fechaISO}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTareasDelDia(data);
        } else {
          console.warn("Respuesta inesperada del servidor:", data);
          setTareasDelDia([]);
        }
      })
      .catch((err) => {
        console.error("Error al cargar tareas del día:", err);
        setTareasDelDia([]);
      });
  }, [fechaSeleccionada]);

  // ✅ Obtener fechas con tareas para resaltar
  useEffect(() => {
    const mes = fechaSeleccionada.toISOString().slice(0, 7); // "2025-08"

    fetch(`http://localhost:5000/api/tareas/fechas-con-tareas?mes=${mes}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFechasConTareas(data);
        }
      })
      .catch((err) => console.error("Error al obtener fechas con tareas:", err));
  }, [fechaSeleccionada]);

  const exportarPDF = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert("Por favor seleccioná ambas fechas.");
      return;
    }
    const desde = fechaDesde.toISOString().slice(0, 10);
    const hasta = fechaHasta.toISOString().slice(0, 10);
    try {
      const res = await fetch(`http://localhost:5000/api/tareas/rango?desde=${desde}&hasta=${hasta}`);
      const data = await res.json();

      const doc = new jsPDF();
      doc.text("Historial de Tareas", 14, 15);

      const rows = data.map(t => [
        t.fechaSemana,
        t.dia,
        t.descripcion,
        t.estado
      ]);

      doc.autoTable({
        head: [["Fecha", "Día", "Descripción", "Estado"]],
        body: rows,
        startY: 25,
      });

      doc.save(`Historial_Tareas_${desde}_a_${hasta}.pdf`);
      setMostrarModal(false);
    } catch (err) {
      console.error("Error al exportar tareas:", err);
      alert("Ocurrió un error al exportar.");
    }
  };


  const esFuturo = new Date(fechaSeleccionada) > new Date();

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
          const fecha = date.toISOString().slice(0, 10);
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
          tareasDelDia.map((t) => (
            <li key={t._id} className={`tarea ${t.estado}`}>
              <strong>{t.dia}:</strong> {t.descripcion} — <em>{t.estado}</em>
            </li>
          ))
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
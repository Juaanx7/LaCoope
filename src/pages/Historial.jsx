import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/HistorialTareas.scss";

function HistorialTareas() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [tareasDelDia, setTareasDelDia] = useState([]);

  useEffect(() => {
    const fechaISO = fechaSeleccionada.toISOString().slice(0, 10);
    fetch(`http://localhost:5000/api/tareas?dia=${fechaISO}`)
      .then((res) => res.json())
      .then((data) => setTareasDelDia(data))
      .catch((err) => console.error("Error al cargar tareas del día:", err));
  }, [fechaSeleccionada]);

  return (
    <div className="historial-container">
      <h1>📅 Historial de Tareas</h1>
      
      {/* 📆 Calendario de selección */}
      <DatePicker
        selected={fechaSeleccionada}
        onChange={(date) => setFechaSeleccionada(date)}
        dateFormat="yyyy-MM-dd"
        inline
      />


      <h2>Tareas del {fechaSeleccionada.toLocaleDateString()}</h2>

      {/* 📋 Lista de tareas */}
      <ul className="tareas-lista">
        {tareasDelDia.length === 0 ? (
          <p>🎉 No se registraron tareas para este día.</p>
        ) : (
          tareasDelDia.map((t) => (
            <li key={t._id} className={`tarea ${t.estado}`}>
              <strong>{t.dia}:</strong> {t.descripcion} — <em>{t.estado}</em>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default HistorialTareas;
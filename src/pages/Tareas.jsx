import { useState } from "react";
import "../styles/Tareas.scss";
import { useNavigate } from "react-router-dom";

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

function Tareas() {
  const [tareas, setTareas] = useState({
    Lunes: [],
    Martes: [],
    Miércoles: [],
    Jueves: [],
    Viernes: [],
  });

  const [nuevaTarea, setNuevaTarea] = useState("");
  const [diaSeleccionado, setDiaSeleccionado] = useState("");
  const navigate = useNavigate();

  const agregarTarea = (dia) => {
    if (!nuevaTarea.trim()) return;
    const nueva = {
      texto: nuevaTarea,
      estado: "pendiente",
      id: Date.now(),
    };
    setTareas({
      ...tareas,
      [dia]: [...tareas[dia], nueva],
    });
    setNuevaTarea("");
    setDiaSeleccionado("");
  };

  const cambiarEstado = (dia, id) => {
    setTareas({
      ...tareas,
      [dia]: tareas[dia].map((tarea) => {
        if (tarea.id === id) {
          const siguiente = {
            pendiente: "en proceso",
            "en proceso": "finalizada",
            finalizada: "pendiente",
          };
          return { ...tarea, estado: siguiente[tarea.estado] };
        }
        return tarea;
      }),
    });
  };

  return (
    <div className="tareas-container">
      <h1>🛠️ Trabajos Diarios</h1>
      <button className="btn-historial" onClick={() => navigate("/historial")}>
        📅 Ver historial mensual
      </button>
      <div className="semana">
        {diasSemana.map((dia) => (
          <div key={dia} className="dia">
            <h3>{dia}</h3>

            {tareas[dia].map((t) => (
              <div
                key={t.id}
                className={`tarea ${t.estado}`}
                onClick={() => cambiarEstado(dia, t.id)}
              >
                {t.texto} <span className="estado">({t.estado})</span>
              </div>
            ))}

            {diaSeleccionado === dia ? (
              <div className="form-nueva-tarea">
                <input
                  type="text"
                  value={nuevaTarea}
                  onChange={(e) => setNuevaTarea(e.target.value)}
                  placeholder="Descripción..."
                />
                <button onClick={() => agregarTarea(dia)}>Guardar</button>
              </div>
            ) : (
              <button onClick={() => setDiaSeleccionado(dia)}>+ Nueva Tarea</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tareas;
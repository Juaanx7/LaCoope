import { useState, useEffect } from "react";
import "../styles/Estadisticas.scss";

function Estadisticas() {
  const [clientes, setClientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalClientes: 0,
    clientesActivos: 0,
    clientesInactivos: 0,
    planes: { "15 mb": 0, "30 mb": 0, "50 mb": 0 },
  });

  // 📌 Cargar clientes desde la API
  useEffect(() => {
    fetch("http://localhost:5000/api/clientes")
      .then((res) => res.json())
      .then((data) => {
        setClientes(data);
        calcularEstadisticas(data);
      })
      .catch((error) => console.error("Error al obtener clientes:", error));
  }, []);

  // 📊 Calcular estadísticas
  const calcularEstadisticas = (clientes) => {
    const totalClientes = clientes.length;
    const clientesActivos = clientes.filter((c) => c.estado === "activo").length;
    const clientesInactivos = totalClientes - clientesActivos;
    
    const planes = {
      "15 mb": clientes.filter((c) => c.plan === "15").length,
      "30 mb": clientes.filter((c) => c.plan === "30").length,
      "50 mb": clientes.filter((c) => c.plan === "50").length,
    };

    setEstadisticas({
      totalClientes,
      clientesActivos,
      clientesInactivos,
      planes,
    });
  };

  return (
    <div className="estadisticas-container">
      <h1>📊 Estadísticas del Servicio</h1>

      <div className="estadisticas-card">
        <h2>📌 Total de Clientes: {estadisticas.totalClientes}</h2>
        <p>✅ Activos: {estadisticas.clientesActivos}</p>
        <p>⚠️ Inactivos: {estadisticas.clientesInactivos}</p>
      </div>

      <div className="estadisticas-card">
        <h2>📡 Distribución de Planes</h2>
        <p>15 mb: {estadisticas.planes["15 mb"]} clientes</p>
        <p>30 mb: {estadisticas.planes["30 mb"]} clientes</p>
        <p>50 mb: {estadisticas.planes["50 mb"]} clientes</p>
      </div>
    </div>
  );
}

export default Estadisticas;
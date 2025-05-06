import { useState, useEffect } from "react";
import "../styles/Estadisticas.scss";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

function Estadisticas() {
  const [clientes, setClientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalClientes: 0,
    clientesActivos: 0,
    clientesInactivos: 0,
    planes: { "15 mb": 0, "30 mb": 0, "50 mb": 0 },
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/clientes")
      .then((res) => res.json())
      .then((data) => {
        setClientes(data);
        calcularEstadisticas(data);
      })
      .catch((error) => console.error("Error al obtener clientes:", error));
  }, []);

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

  const pieData = {
    labels: ["15 mb", "30 mb", "50 mb"],
    datasets: [
      {
        label: "Clientes por Plan",
        data: [
          estadisticas.planes["15 mb"],
          estadisticas.planes["30 mb"],
          estadisticas.planes["50 mb"],
        ],
        backgroundColor: ["#36A2EB", "#FFCE56", "#FF6384"],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: ["Activos", "Inactivos"],
    datasets: [
      {
        label: "Clientes por estado",
        data: [estadisticas.clientesActivos, estadisticas.clientesInactivos],
        backgroundColor: ["#4CAF50", "#F44336"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="estadisticas-container">
      <h1>📊 Estadísticas del Servicio</h1>

      <div className="estadisticas-card">
        <h2>📌 Total de Clientes: {estadisticas.totalClientes}</h2>
        <p>✅ Activos: {estadisticas.clientesActivos}</p>
        <p>⚠️ Inactivos: {estadisticas.clientesInactivos}</p>
      </div>

      <div className="estadisticas-graficos">
        <div className="grafico">
          <h3>📡 Distribución de Planes</h3>
          <Pie data={pieData} />
        </div>
        <div className="grafico">
          <h3>⚡ Activos / Inactivos</h3>
          <Bar data={barData} />
        </div>
      </div>
    </div>
  );
}

export default Estadisticas;
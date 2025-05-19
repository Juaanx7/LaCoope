import "../styles/Home.scss";
import { Link } from "react-router-dom";

function HomeFibracoop() {
  return (
    <div className="home-container">
      <h1>Bienvenido al Panel de Gestión de Internet</h1>
      <p>Aquí puedes administrar la información de los clientes y sus conexiones.</p>

      <div className="home-sections">
        <Link to="/fibracoop/clientes" className="card">
          <h2>📋 Gestión de Clientes</h2>
          <p>Consulta, edita y administra la información de los clientes.</p>
        </Link>

        <Link to="/fibracoop/estadisticas" className="card">
          <h2>📡 Estadísticas</h2>
          <p>Revisa y gestiona el estado de las conexiones activas.</p>
        </Link>

        <Link to="/fibracoop/configuracion" className="card">
          <h2>⚙️ Configuración</h2>
          <p>Accede a herramientas de configuración y ajustes del sistema.</p>
        </Link>
      </div>
    </div>
  );
}

export default HomeFibracoop;
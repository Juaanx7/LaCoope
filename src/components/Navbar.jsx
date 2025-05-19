import "../styles/Navbar.scss";
import { NavLink, Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" className="navbar-title">
          ⚡ Cooperativa Ltda de Electricidad
        </Link>
      </div>
      <ul className="navbar-links">
        <li><NavLink to="/fibracoop">Inicio</NavLink></li>
        <li><NavLink to="/fibracoop/clientes">Clientes</NavLink></li>
        <li><NavLink to="/fibracoop/configuracion">Configuración</NavLink></li>
        <li><NavLink to="/fibracoop/estadisticas">📊 Estadísticas</NavLink></li>
      </ul>
    </nav>
  );
}

export default Navbar;
import { Link } from "react-router-dom";
import "../styles/Navbar.scss";
import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">🌐 Fibracoop</div>
      <ul className="navbar-links">
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/clientes">Clientes</Link></li>
        <li><Link to="/configuracion">Configuración</Link></li>
        <li><Link to="/estadisticas">📊 Estadísticas</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
import "../styles/Navbar.scss";
import { NavLink, Link } from "react-router-dom";
import AreaSelector from "./AreaSelector";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" className="navbar-title">
          Cooperativa Ltda de Electricidad de San Marcos Sierras
        </Link>
      </div>

      <div style={{ marginLeft: "auto" }}>
        <AreaSelector />
      </div>

      <ul className="navbar-links">
        <li><NavLink to="/">Tablero</NavLink></li>
        <li><NavLink to="/historial">Historial</NavLink></li>
      </ul>
    </nav>
  );
}

export default Navbar;
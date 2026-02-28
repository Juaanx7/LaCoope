import "../styles/Navbar.scss";
import { NavLink, Link } from "react-router-dom";
import AreaSelector from "./AreaSelector";
import logo from "../assets/logo-coope.png";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" className="navbar-title">
          <img src={logo} alt="Cooperativa logo" className="navbar-logo-img" />
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
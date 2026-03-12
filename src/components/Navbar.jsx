import "../styles/Navbar.scss";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { FiUser, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { useState } from "react";
import AreaSelector from "./AreaSelector";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo-coope.png";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login", { replace: true });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/" className="navbar-title" onClick={closeMenu}>
            <img src={logo} alt="Cooperativa logo" className="navbar-logo-img" />
          </Link>
        </div>

        {/* Desktop nav */}
        <ul className="navbar-links">
          <li>
            <NavLink to="/" onClick={closeMenu}>Tablero</NavLink>
          </li>
          <li>
            <NavLink to="/historial" onClick={closeMenu}>Historial</NavLink>
          </li>
        </ul>

        <div className="navbar-right">
          <div className="navbar-area">
            <AreaSelector />
          </div>

          {/* Desktop account */}
          <div className="navbar-account">
            <div className="navbar-user">
              <FiUser />
              <span>{user?.name || "Usuario"}</span>
            </div>

            <button className="navbar-logout" onClick={handleLogout}>
              <FiLogOut />
              <span>Cerrar sesión</span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="navbar-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`navbar-overlay ${menuOpen ? "navbar-overlay--visible" : ""}`}
        onClick={closeMenu}
      />

      {/* Mobile drawer */}
      <aside className={`navbar-drawer ${menuOpen ? "navbar-drawer--open" : ""}`}>
        <div className="navbar-drawer__header">
          <span>Menú</span>
          <button
            className="navbar-drawer__close"
            onClick={closeMenu}
            aria-label="Cerrar menú"
          >
            <FiX />
          </button>
        </div>

        <nav className="navbar-drawer__nav">
          <NavLink to="/" onClick={closeMenu}>
            Tablero
          </NavLink>
          <NavLink to="/historial" onClick={closeMenu}>
            Historial
          </NavLink>
        </nav>

        <div className="navbar-drawer__footer">
          <div className="navbar-drawer__user">
            <FiUser />
            <span>{user?.name || "Usuario"}</span>
          </div>

          <button className="navbar-drawer__logout" onClick={handleLogout}>
            <FiLogOut />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
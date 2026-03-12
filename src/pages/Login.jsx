import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoCoope from "../assets/logo-coope.png";
import "../styles/login.scss";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e?.message || "Error al iniciar sesión");
    } finally {
      setSaving(false);
    }
  };

  const [showPass, setShowPass] = useState(false);

  return (
    <div className="login">
      <div className="login__shell">
        <aside className="login__left" aria-hidden="true">
          <div className="login__abstract">
            <span className="blob blob--1" />
            <span className="blob blob--2" />
            <span className="blob blob--3" />
            <span className="line" />
          </div>

          <div className="login__leftContent">
            <img className="login__logo" src={logoCoope} alt="La Coope" />
            <h1 className="login__brandTitle">CoopeWeb</h1>
            <p className="login__brandText">
              Acceso al sistema interno de gestión.
            </p>
          </div>
        </aside>

        {/* Formulario */}
        <main className="login__right">
          <form className="login__card" onSubmit={onSubmit}>
            <div className="login__cardHead">
              <img className="login__logo login__logo--mobile" src={logoCoope} alt="La Coope" />
              <h2 className="login__title">Iniciar sesión</h2>
              <p className="login__subtitle">Ingresá con tu cuenta habilitada</p>
            </div>

            {error ? (
              <div className="login__alert" role="alert">
                {error}
              </div>
            ) : null}

            <label className="login__label">
              Email
              <input
                className="login__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@mail.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="login__label">
              Contraseña
              <div className="login__inputWrap">
                <input
                  className="login__input login__input--withBtn"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login__inputBtn"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </label>

            <button className="login__btn" disabled={saving} type="submit">
              {saving ? "Ingresando…" : "Ingresar"}
            </button>

            <p className="login__help">
              Si no tenés acceso, consultá con el administrador del sistema.
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
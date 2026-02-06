import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
      setError(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 16 }}>
      <form onSubmit={onSubmit} style={{ width: "min(420px, 100%)", border: "1px solid rgba(0,0,0,.1)", borderRadius: 16, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Iniciar sesión</h2>

        {error ? (
          <div style={{ background: "rgba(220,53,69,.10)", border: "1px solid rgba(220,53,69,.25)", padding: 10, borderRadius: 12, marginBottom: 12 }}>
            {error}
          </div>
        ) : null}

        <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@mail.com" />
        </label>

        <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        <button disabled={saving} className="btn btn-primary" type="submit" style={{ width: "100%" }}>
          {saving ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
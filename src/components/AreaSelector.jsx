import { useEffect, useState } from "react";
import { useArea } from "../context/AreaContext";

export default function AreaSelector() {
  const { area, setArea } = useArea();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/areas")
      .then(r => r.json())
      .then(json => setAreas(json.data || json)) // soporta {ok,data} o array directo
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <label style={{ fontSize: 14, opacity: .8 }}>Área:</label>
      <select
        value={area}
        onChange={(e) => setArea(e.target.value)}
        disabled={loading}
        style={{ padding: "6px 8px", borderRadius: 6 }}
      >
        {areas.map(a => (
          <option key={a._id} value={a.slug}>{a.name}</option>
        ))}
      </select>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";
function apiUrl(path) {
  if (path && !path.startsWith("/")) path = "/" + path;
  return API_BASE + path;
}  
import { useArea } from "../context/AreaContext";
import "../styles/AreaSelector.scss";

const FALLBACK = [
  { slug: "internet", name: "Internet" },
];

export default function AreaSelector() {
  const { area, setArea } = useArea();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ac = new AbortController();

    setLoading(true);
    fetch(apiUrl("/api/areas"), { signal: ac.signal })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error || "Error al cargar áreas");
        return data;
      })
      .then((json) => setAreas(Array.isArray(json) ? json : json?.data || []))
      .catch(() => setAreas([]))
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, []);

  const options = useMemo(() => {
    const list = areas?.length ? areas : FALLBACK;
    if (!list.some((a) => a.slug === area)) {
      return [{ slug: area, name: area }, ...list];
    }
    return list;
  }, [areas, area]);

  return (
    <div className="area-selector">
      <span className="area-selector__label">Área</span>

      <select
        className="area-selector__select"
        value={area}
        onChange={(e) => setArea(e.target.value)}
        disabled={loading}
      >
        {options.map((a) => (
          <option key={a.slug} value={a.slug}>
            {a.name}
          </option>
        ))}
      </select>
    </div>
  );
}

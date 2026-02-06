import { useEffect, useMemo, useState } from "react";
import { useArea } from "../context/AreaContext";

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
    fetch("/api/areas", { signal: ac.signal })
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
    // si el área actual no está en la lista, la agregamos para que no quede “sin opción”
    if (!list.some((a) => a.slug === area)) {
      return [{ slug: area, name: area }, ...list];
    }
    return list;
  }, [areas, area]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <label style={{ fontSize: 14, opacity: 0.8 }}>Área:</label>
      <select
        value={area}
        onChange={(e) => setArea(e.target.value)}
        disabled={loading}
        style={{ padding: "6px 8px", borderRadius: 6 }}
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

const API_BASE = import.meta.env.VITE_API_URL || "";

export function apiUrl(path) {
  // ensure leading slash on path
  if (path && !path.startsWith("/")) path = "/" + path;
  return API_BASE + path;
}

export async function apiFetch(path, { token, ...options } = {}) {
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error || "Error de servidor");
  }
  return json;
}    
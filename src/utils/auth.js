const AUTH_KEY = "auth";
export const SESSION_DURATION = 1000 * 60 * 60 * 8;

export function getStoredAuth() {
  const raw = sessionStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    if (!parsed?.token || !parsed?.expiresAt) {
      sessionStorage.removeItem(AUTH_KEY);
      return null;
    }

    if (parsed.expiresAt < Date.now()) {
      sessionStorage.removeItem(AUTH_KEY);
      return null;
    }

    return parsed;
  } catch {
    sessionStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function getToken() {
  return getStoredAuth()?.token || "";
}

export function saveAuth(token, duration = SESSION_DURATION) {
  const authData = {
    token,
    expiresAt: Date.now() + duration,
  };

  sessionStorage.setItem(AUTH_KEY, JSON.stringify(authData));
}

export function clearAuth() {
  sessionStorage.removeItem(AUTH_KEY);
}
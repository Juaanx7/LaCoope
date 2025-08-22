import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AreaContext = createContext();

export function AreaProvider({ children }) {
  const [area, setArea] = useState(() => localStorage.getItem("lacoope_area") || "internet");
  useEffect(() => localStorage.setItem("lacoope_area", area), [area]);

  const value = useMemo(() => ({ area, setArea }), [area]);
  return <AreaContext.Provider value={value}>{children}</AreaContext.Provider>;
}

export function useArea() {
  const ctx = useContext(AreaContext);
  if (!ctx) throw new Error("useArea must be used within AreaProvider");
  return ctx;
}
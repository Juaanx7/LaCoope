// src/middlewares/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ error: "No autenticado" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("email role name");

    if (!user) return res.status(401).json({ error: "Usuario no válido" });

    req.user = user; // <-- queda disponible en rutas/controladores
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: "No autenticado" });

    if (!roles.includes(role)) {
      return res.status(403).json({ error: "No tenés permisos" });
    }
    next();
  };
}
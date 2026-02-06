// src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Faltan credenciales" });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    // ✅ activo por defecto: solo bloquea si active === false
    if (!user || user.active === false) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = signToken(user);

    return res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ error: "Error en login" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  // requireAuth ya cargó el usuario y lo dejó en req.user
  const user = req.user;

  // ✅ si querés validar active acá también:
  if (!user || user.active === false) return res.status(401).json({ error: "No autorizado" });

  return res.json({
    user: { id: user._id, email: user.email, name: user.name, role: user.role },
  });
});

export default router;
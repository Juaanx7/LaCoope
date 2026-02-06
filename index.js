import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import clientesRoutes from "./src/routes/clientes.js";
import tareasRoutes from "./src/routes/tareas.js";
import areasRoutes from "./src/routes/areas.routes.js";
import authRouter from "./src/routes/auth.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
console.log("🔍 Intentando conectar con MongoDB Atlas...");

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("🔥 Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB Atlas:", err));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "lacoope-api", status: "healthy" });
});

// ✅ Registrar rutas API
app.use("/api/auth", authRouter);
app.use("/api/areas", areasRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/tareas", tareasRoutes);

// ✅ 404 para API
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada en la API" });
});

// ✅ Servir frontend si existe dist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.log("⚠️ La carpeta 'dist' no existe. Solo se ejecutará la API.");
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));

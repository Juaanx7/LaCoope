import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import clientesRoutes from "./src/routes/clientes.js";
import tareasRoutes from "./src/routes/tareas.js";
import areasRoutes from "./src/routes/areas.routes.js"; // ⬅️ nuevo

dotenv.config();
const app = express();

// 📌 Middleware
app.use(express.json());
app.use(cors());

// 📌 Conectar a MongoDB Atlas (soporta ambas vars)
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
console.log("🔍 Intentando conectar con MongoDB Atlas...");

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("🔥 Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB Atlas:", err));

// 📌 Healthcheck simple
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "lacoope-api", status: "healthy" });
});

// 📌 1️⃣ Registrar rutas de la API
app.use("/api/clientes", clientesRoutes);
app.use("/api/tareas", tareasRoutes);
app.use("/api/areas", areasRoutes); // ⬅️ nuevo

// 📌 2️⃣ Manejo de 404 para API
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada en la API" });
});

// 📌 3️⃣ Servir el frontend solo si existe dist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.log("⚠️ La carpeta 'dist' no existe. Solo se ejecutará la API.");
}

// 📌 4️⃣ Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
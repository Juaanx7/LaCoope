import express from "express";
import Tarea from "../models/Tarea.model.js";

const router = express.Router();

// 📌 Obtener tareas por semana
router.get("/", async (req, res) => {
  const { semana } = req.query;
  try {
    if (!semana) return res.status(400).json({ error: "Falta la fecha de la semana" });
    const tareas = await Tarea.find({ fechaSemana: semana });
    res.json(tareas);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener tareas" });
  }
});

// 📌 Crear nueva tarea
router.post("/", async (req, res) => {
  try {
    const tarea = new Tarea(req.body);
    await tarea.save();
    res.status(201).json(tarea);
  } catch (err) {
    res.status(400).json({ error: "Error al crear tarea" });
  }
});

// 📌 Actualizar tarea
router.put("/:id", async (req, res) => {
  try {
    const tarea = await Tarea.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json(tarea);
  } catch (err) {
    res.status(400).json({ error: "Error al actualizar tarea" });
  }
});

// 📌 Eliminar tarea
router.delete("/:id", async (req, res) => {
  try {
    const tarea = await Tarea.findByIdAndDelete(req.params.id);
    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json({ message: "Tarea eliminada" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar tarea" });
  }
});

export default router;
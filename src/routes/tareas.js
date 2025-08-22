import express from "express";
import Tarea from "../models/Tarea.model.js";
import Area from "../models/Area.model.js"; // si lo usás en crear/actualizar; quitalo si no

const router = express.Router();

function toSlug(text) {
  return text
    ?.toString()
    ?.normalize("NFD")
    ?.replace(/[\u0300-\u036f]/g, "")
    ?.toLowerCase()
    ?.replace(/[^a-z0-9\s-]/g, "")
    ?.trim()
    ?.replace(/\s+/g, "-")
    ?.replace(/-+/g, "-");
}

const isObjectId = (v) => /^[a-f\d]{24}$/i.test(v);

// 📌 Obtener tareas (compat y filtros nuevos opcionales)
router.get("/", async (req, res) => {
  const { semana, area, week, from, to, status, q } = req.query;
  try {
    const filter = {};

    if (semana) filter.fechaSemana = semana;                // compat
    if (area) filter.area = toSlug(area);
    if (week) filter.week = week;

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (status) {
      const map = (s) => {
        const v = String(s).toLowerCase().replace(/\s+/g, "_");
        const dict = { pendiente: "pending", "en_proceso": "in_progress", "en proceso": "in_progress", finalizada: "done" };
        return dict[v] || v;
      };
      filter.status = { $in: String(status).split(",").map(map) };
    }

    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
        { notes: new RegExp(q, "i") },
      ];
    }

    const tareas = await Tarea.find(filter).sort({ date: 1, priority: 1, createdAt: -1 });
    res.json(tareas);
  } catch (err) {
    console.error("Error al obtener tareas:", err);
    res.status(500).json({ error: "Error al obtener tareas" });
  }
});

// 📌 (MOVER ARRIBA) Fechas con tareas del mes (compat) + filtro área
router.get("/fechas-con-tareas", async (req, res) => {
  const { mes, area } = req.query; // "YYYY-MM"
  if (!mes) return res.status(400).json({ error: "Falta el mes" });
  try {
    const filter = { fechaSemana: { $regex: `^${mes}` } };
    if (area) filter.area = toSlug(area);
    const tareas = await Tarea.find(filter).select("fechaSemana").lean();
    const fechas = [...new Set(tareas.map((t) => t.fechaSemana))];
    res.json(fechas);
  } catch (err) {
    console.error("Error en fechas-con-tareas:", err);
    res.status(500).json({ error: "Error al obtener fechas" });
  }
});

// 📌 (MOVER ARRIBA) Rango por fechas (compat) + filtro área
router.get("/rango", async (req, res) => {
  const { desde, hasta, area } = req.query;
  if (!desde || !hasta) {
    return res.status(400).json({ error: "Faltan fechas 'desde' o 'hasta'" });
  }
  try {
    const filter = {
      date: {
        $gte: new Date(desde),
        $lte: new Date(`${hasta}T23:59:59.999Z`),
      },
    };
    if (area) filter.area = toSlug(area);

    let tareas = await Tarea.find(filter).sort({ date: 1, priority: 1 });
    if (tareas.length === 0) {
      const fb = { fechaSemana: { $gte: desde, $lte: hasta } };
      if (area) fb.area = toSlug(area);
      tareas = await Tarea.find(fb).sort({ fechaSemana: 1 });
    }
    res.json(tareas);
  } catch (err) {
    console.error("Error al obtener tareas por rango:", err);
    res.status(500).json({ error: "Error al buscar tareas por rango de fechas" });
  }
});

// 📌 Obtener por ID (con guard de ObjectId)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(404).json({ error: "Tarea no encontrada" });
    const tarea = await Tarea.findById(id);
    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json(tarea);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener tarea" });
  }
});

// 📌 Crear
router.post("/", async (req, res) => {
  try {
    const { title, titulo, area, date, fecha, description, descripcion, status, estado, priority, prioridad, notes, notas } = req.body;
    const _title = (title || titulo || "").trim();
    const _area = toSlug(area);
    if (!_title || !_area) return res.status(400).json({ error: "title/titulo y area son obligatorios" });

    const created = await Tarea.create({
      title: _title,
      description: description ?? descripcion ?? "",
      area: _area,
      status: (status || estado || "pending").toLowerCase().replace(/\s+/g, "_"),
      priority: (priority || prioridad || "med"),
      date: fecha ? new Date(fecha) : (date ? new Date(date) : new Date()),
      notes: notes ?? notas ?? "",
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("Error al crear tarea:", err);
    res.status(400).json({ error: "Error al crear tarea" });
  }
});

// 📌 Actualizar
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(404).json({ error: "Tarea no encontrada" });

    const payload = { ...req.body };
    if (payload.area) payload.area = toSlug(payload.area);
    if (payload.date) payload.date = new Date(payload.date);

    const tarea = await Tarea.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

    if (payload.date) { // recalcula week/fechaSemana
      await tarea.validate();
      await tarea.save();
    }

    res.json(tarea);
  } catch (err) {
    console.error("Error al actualizar tarea:", err);
    res.status(400).json({ error: "Error al actualizar tarea" });
  }
});

// 📌 Eliminar
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(404).json({ error: "Tarea no encontrada" });
    const tarea = await Tarea.findByIdAndDelete(id);
    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json({ message: "Tarea eliminada" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar tarea" });
  }
})

export default router;
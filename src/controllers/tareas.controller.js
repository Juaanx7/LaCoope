import Task, { TASK_STATUSES, TASK_PRIORITIES } from "../models/Task.model.js";
import Area from "../models/Area.model.js"; // Para validar área existente (por slug o name)

// helper: normaliza slug simple
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

// GET /api/tareas
// Filtros: ?area=internet&week=2025-W34&from=YYYY-MM-DD&to=YYYY-MM-DD&status=pending,in_progress&q=texto
export const listTasks = async (req, res) => {
  try {
    const { area, week, from, to, status, q } = req.query;

    const filter = {};
    if (area) filter.area = toSlug(area);

    if (week) filter.week = week;

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999); // inclusivo
        filter.date.$lte = end;
      }
    }

    if (status) {
      const list = String(status)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      filter.status = { $in: list };
    }

    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
        { notes: new RegExp(q, "i") },
      ];
    }

    const tasks = await Task.find(filter).sort({ date: 1, priority: 1, createdAt: -1 });
    res.json({ ok: true, data: tasks });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// GET /api/tareas/:id
export const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ ok: false, error: "Tarea no encontrada" });
    res.json({ ok: true, data: task });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// POST /api/tareas
export const createTask = async (req, res) => {
  try {
    let { title, description = "", area, status = "pending", priority = "med", date, notes = "" } =
      req.body;

    if (!title || !area) {
      return res.status(400).json({ ok: false, error: "title y area son obligatorios" });
    }

    // normalizar area a slug y validar que exista
    const areaSlug = toSlug(area);
    const areaExists =
      (await Area.findOne({ slug: areaSlug })) || (await Area.findOne({ name: new RegExp(`^${area}$`, "i") }));
    if (!areaExists) {
      return res.status(400).json({ ok: false, error: `El área '${area}' no existe` });
    }

    if (!TASK_STATUSES.includes(status)) status = "pending";
    if (!TASK_PRIORITIES.includes(priority)) priority = "med";

    const payload = {
      title,
      description,
      area: areaSlug,
      status,
      priority,
      date: date ? new Date(date) : new Date(),
      notes,
    };

    const created = await Task.create(payload);
    res.status(201).json({ ok: true, data: created });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// PUT /api/tareas/:id  (update general)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ["title", "description", "status", "priority", "date", "notes", "area"];
    const payload = {};

    for (const k of allowed) {
      if (typeof req.body[k] !== "undefined") payload[k] = req.body[k];
    }

    // normalizar/validar si cambian área/estado/prioridad/fecha
    if (payload.area) {
      payload.area = toSlug(payload.area);
      const areaExists =
        (await Area.findOne({ slug: payload.area })) || (await Area.findOne({ name: new RegExp(`^${payload.area}$`, "i") }));
      if (!areaExists) {
        return res.status(400).json({ ok: false, error: `El área '${payload.area}' no existe` });
      }
    }
    if (payload.status && !TASK_STATUSES.includes(payload.status)) {
      return res.status(400).json({ ok: false, error: "status inválido" });
    }
    if (payload.priority && !TASK_PRIORITIES.includes(payload.priority)) {
      return res.status(400).json({ ok: false, error: "priority inválida" });
    }
    if (payload.date) payload.date = new Date(payload.date);

    const updated = await Task.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ ok: false, error: "Tarea no encontrada" });

    // Si cambió la fecha, el pre-validate volverá a calcular 'week' en próximo save,
    // pero como usamos findByIdAndUpdate, forzamos recalcular guardando:
    if (payload.date) {
      updated.week = undefined; // trigger pre-validate recompute
      await updated.validate();
      await updated.save();
    }

    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// PATCH /api/tareas/:id/status  (cambio rápido de estado)
export const patchTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!TASK_STATUSES.includes(status)) {
      return res.status(400).json({ ok: false, error: "status inválido" });
    }
    const updated = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Tarea no encontrada" });
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// DELETE /api/tareas/:id
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Task.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ ok: false, error: "Tarea no encontrada" });
    res.json({ ok: true, data: removed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
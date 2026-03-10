import Tarea, { ESTADOS, PRIORIDADES } from "../models/Tarea.model.js";
import Area from "../models/Area.model.js";

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
        end.setHours(23, 59, 59, 999);
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

    const tasks = await Tarea.find(filter).sort({ date: 1, priority: 1, createdAt: -1 });
    res.json({ ok: true, data: tasks });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// GET /api/tareas/:id
export const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Tarea.findById(id);
    if (!task) return res.status(404).json({ ok: false, error: "Tarea no encontrada" });
    res.json({ ok: true, data: task });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// POST /api/tareas
export const createTask = async (req, res) => {
  try {
    let { title, description = "", client = "", area, status = "pending", priority = "med", date, notes = "" } = req.body;

    if (!title || !area) {
      return res.status(400).json({ ok: false, error: "title y area son obligatorios" });
    }

    // normalizar area a slug y validar que exista
    const areaSlug = toSlug(area);
    const areaExists =
      (await Area.findOne({ slug: areaSlug })) ||
      (await Area.findOne({ name: new RegExp(`^${area}$`, "i") }));

    if (!areaExists) {
      return res.status(400).json({ ok: false, error: `El área '${area}' no existe` });
    }

    if (!ESTADOS.includes(status)) status = "pending";
    if (!PRIORIDADES.includes(priority)) priority = "med";

    const payload = {
      title,
      description,
      client,
      area: areaSlug,
      status,
      priority,
      date: date ? new Date(date) : new Date(),
      notes,
    };

    const created = await Tarea.create(payload);
    res.status(201).json({ ok: true, data: created });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// PUT /api/tareas/:id
export const updateTask = async (req, res) => {
    try {
      const { id } = req.params;

      // 🔐 requiere que exista req.user (lo vamos a asegurar en el punto 5 con requireAuth)
      const role = req.user?.role;

      if (!role) {
        return res.status(401).json({ ok: false, error: "No autenticado" });
      }

      const tarea = await Tarea.findById(id);
      if (!tarea) return res.status(404).json({ ok: false, error: "Tarea no encontrada" });

      const isPending = tarea.status === "pending";

      // ✅ campos permitidos según rol
      let allowed = [];

      if (role === "admin") {
        allowed = ["title", "description", "client", "status", "priority", "date", "notes", "area"];
      } else if (role === "tecnico") {
        allowed = ["status", "priority", "notes"];
      } else if (role === "atencion") {
        if (!isPending) {
          return res.status(403).json({
            ok: false,
            error: "Atención al público solo puede editar si la tarea está Pendiente",
          });
        }
        allowed = ["title", "description", "client"];
      } else {
        return res.status(403).json({ ok: false, error: "Rol no permitido" });
      }

      // construir payload filtrado
      const payload = {};
      for (const k of allowed) {
        if (typeof req.body[k] !== "undefined") payload[k] = req.body[k];
      }

      // si no mandó nada permitido
      if (Object.keys(payload).length === 0) {
        return res.status(400).json({ ok: false, error: "No hay campos permitidos para actualizar" });
      }

      // ===== validaciones existentes (adaptadas) =====

      // normalizar/validar area
      if (payload.area) {
        const areaSlug = toSlug(payload.area);
        payload.area = areaSlug;

        const areaExists =
          (await Area.findOne({ slug: areaSlug })) ||
          (await Area.findOne({ name: new RegExp(`^${payload.area}$`, "i") }));

        if (!areaExists) {
          return res.status(400).json({ ok: false, error: `El área '${payload.area}' no existe` });
        }
      }

      if (payload.status && !ESTADOS.includes(payload.status)) {
        return res.status(400).json({ ok: false, error: "status inválido" });
      }

      if (payload.priority && !PRIORIDADES.includes(payload.priority)) {
        return res.status(400).json({ ok: false, error: "priority inválida" });
      }

      if (payload.date) payload.date = new Date(payload.date);

      // update
      const updated = await Tarea.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
      });

      if (!updated) return res.status(404).json({ ok: false, error: "Tarea no encontrada" });

      // si cambió fecha, recalcular week/fechaSemana forzando validate/save (igual que tu lógica)
      if (payload.date) {
        updated.week = undefined;
        await updated.validate();
        await updated.save();
      }

      res.json({ ok: true, data: updated });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  };

// PATCH /api/tareas/:id/status
export const patchTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ESTADOS.includes(status)) {
      return res.status(400).json({ ok: false, error: "status inválido" });
    }

    const updated = await Tarea.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
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
    const removed = await Tarea.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ ok: false, error: "Tarea no encontrada" });
    res.json({ ok: true, data: removed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
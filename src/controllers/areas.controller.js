import Area from "../models/Area.model.js";

// Listar áreas (opcional: ?q=texto&active=true|false)
export const listAreas = async (req, res) => {
  try {
    const { q, active } = req.query;
    const filter = {};
    if (typeof active !== "undefined") filter.isActive = active === "true";
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
      ];
    }
    const areas = await Area.find(filter).sort({ name: 1 });
    res.json({ ok: true, data: areas });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Obtener por id o slug
export const getArea = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
    const area = isObjectId
      ? await Area.findById(idOrSlug)
      : await Area.findOne({ slug: idOrSlug });

    if (!area) return res.status(404).json({ ok: false, error: "Área no encontrada" });
    res.json({ ok: true, data: area });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Crear
export const createArea = async (req, res) => {
  try {
    const { name, description = "", isActive = true } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ ok: false, error: "El nombre es obligatorio" });
    }
    const created = await Area.create({ name, description, isActive });
    res.status(201).json({ ok: true, data: created });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ ok: false, error: "El nombre o slug ya existe" });
    }
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Actualizar
export const updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = {};
    ["name", "description", "isActive"].forEach((k) => {
      if (typeof req.body[k] !== "undefined") payload[k] = req.body[k];
    });

    const updated = await Area.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ ok: false, error: "Área no encontrada" });
    res.json({ ok: true, data: updated });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ ok: false, error: "El nombre o slug ya existe" });
    }
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Eliminar (hard delete por ahora)
export const deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Area.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ ok: false, error: "Área no encontrada" });
    res.json({ ok: true, data: removed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
import Area from "../models/Area.model.js";

// helper slug
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

// GET /api/areas
export const listAreas = async (req, res) => {
  try {
    const areas = await Area.find().sort({ name: 1 });
    res.json({ ok: true, data: areas });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// GET /api/areas/:idOrSlug
export const getArea = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    const area = (idOrSlug.match(/^[0-9a-fA-F]{24}$/))
      ? await Area.findById(idOrSlug)
      : await Area.findOne({ slug: toSlug(idOrSlug) });

    if (!area) return res.status(404).json({ ok: false, error: "Área no encontrada" });
    res.json({ ok: true, data: area });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// POST /api/areas
export const createArea = async (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name) return res.status(400).json({ ok: false, error: "name es obligatorio" });

    const finalSlug = toSlug(slug || name);

    const exists = await Area.findOne({ slug: finalSlug });
    if (exists) return res.status(400).json({ ok: false, error: "Ya existe un área con ese slug" });

    const created = await Area.create({ name, slug: finalSlug });
    res.status(201).json({ ok: true, data: created });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// PUT /api/areas/:id
export const updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    const payload = {};
    if (typeof name !== "undefined") payload.name = name;
    if (typeof slug !== "undefined") payload.slug = toSlug(slug);

    if (payload.slug) {
      const exists = await Area.findOne({ slug: payload.slug, _id: { $ne: id } });
      if (exists) return res.status(400).json({ ok: false, error: "Ya existe un área con ese slug" });
    }

    const updated = await Area.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ ok: false, error: "Área no encontrada" });

    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// DELETE /api/areas/:id
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
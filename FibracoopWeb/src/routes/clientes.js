import express from "express";
import Cliente from "../models/Cliente.model.js";

const router = express.Router();

// 📌 Actualizar datos de un cliente
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const clienteActualizado = await Cliente.findByIdAndUpdate(id, req.body, { new: true });

    if (!clienteActualizado) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json(clienteActualizado);
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

export default router;
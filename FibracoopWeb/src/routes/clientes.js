const express = require("express");
const Cliente = require("../models/Cliente.model");

const router = express.Router();

// Obtener todos los clientes
router.get("/", async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los clientes" });
  }
});

// Agregar un nuevo cliente manualmente
router.post("/", async (req, res) => {
  try {
    const nuevoCliente = new Cliente(req.body);
    await nuevoCliente.save();
    res.status(201).json(nuevoCliente);
  } catch (error) {
    res.status(500).json({ error: "Error al guardar el cliente" });
  }
});

module.exports = router;
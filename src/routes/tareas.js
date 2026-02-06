// src/routes/tareas.js
import express from "express";

import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  patchTaskStatus,
  deleteTask,
} from "../controllers/tareas.controller.js";

import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

/**
 * =========================
 * GET /api/tareas
 * =========================
 * Lectura (por ahora sin auth, si querés después lo protegemos)
 */
router.get("/", listTasks);

/**
 * GET /api/tareas/:id
 */
router.get("/:id", getTask);

/**
 * =========================
 * Escritura (requiere login)
 * =========================
 */

/**
 * POST /api/tareas
 */
router.post("/", requireAuth, createTask);

/**
 * PUT /api/tareas/:id
 */
router.put("/:id", requireAuth, updateTask);

/**
 * PATCH /api/tareas/:id/status
 */
router.patch("/:id/status", requireAuth, patchTaskStatus);

/**
 * DELETE /api/tareas/:id
 */
router.delete("/:id", requireAuth, deleteTask);

export default router;

import { Router } from "express";
import {
  listAreas,
  getArea,
  createArea,
  updateArea,
  deleteArea,
} from "../controllers/areas.controller.js";

const router = Router();

// GET /api/areas
router.get("/", listAreas);

// GET /api/areas/:idOrSlug  (acepta ObjectId o slug)
router.get("/:idOrSlug", getArea);

// POST /api/areas
router.post("/", createArea);

// PUT /api/areas/:id
router.put("/:id", updateArea);

// DELETE /api/areas/:id
router.delete("/:id", deleteArea);

export default router;
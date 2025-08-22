/**
 * Seed para crear/actualizar áreas base de LaCoope.
 * Ejecutar con:  npm run seed:areas
 */
import "dotenv/config";
import mongoose from "mongoose";
import Area from "../models/Area.model.js";

const BASE_AREAS = [
  { name: "Internet", description: "Área de conectividad y redes" },
  { name: "Energía", description: "Área de distribución eléctrica" },
  { name: "Administración", description: "Gestión administrativa y contable" },
  { name: "Comercial", description: "Atención al cliente y ventas" },
  { name: "Técnica", description: "Soporte técnico general" },
];

async function main() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error("Falta MONGODB_URI o MONGO_URI en el archivo .env");
    }

    await mongoose.connect(uri);
    console.log("✅ Conectado a MongoDB");

    for (const area of BASE_AREAS) {
      const existing = await Area.findOne({ name: area.name });
      if (existing) {
        existing.description = area.description ?? existing.description;
        if (existing.isActive === undefined) existing.isActive = true;
        await existing.save();
        console.log(`↻ Actualizada área: ${area.name}`);
      } else {
        await Area.create(area);
        console.log(`＋ Creada área: ${area.name}`);
      }
    }

    const count = await Area.countDocuments({});
    console.log(`\n📊 Total de áreas en BD: ${count}`);

    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en seed de áreas:", err.message);
    process.exit(1);
  }
}

main();
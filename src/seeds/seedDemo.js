import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.model.js";

async function run() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGO_URI) throw new Error("Falta MONGO_URI / MONGODB_URI en .env");

  await mongoose.connect(MONGO_URI);

  // Credenciales DEMO (hardcodeadas a propósito para portfolio)
  const email = "demo@lacoope.com";
  const pass = "demo123";

  console.log("✅ Conectado. DB:", mongoose.connection.name);
  console.log("Seedeando DEMO:", email);

  const passwordHash = await bcrypt.hash(pass, 10);

  await User.findOneAndUpdate(
    { email },
    { email, passwordHash, role: "admin", name: "Demo" },
    { upsert: true, new: true }
  );

  console.log("✅ DEMO creado/actualizado:", email, "pass:", pass);
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});
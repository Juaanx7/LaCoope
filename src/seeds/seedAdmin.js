import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.model.js";

async function run() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGO_URI) throw new Error("Falta MONGO_URI / MONGODB_URI en .env");

  await mongoose.connect(MONGO_URI);

  const email = (process.env.ADMIN_EMAIL || "admin@local.com").toLowerCase().trim();
  const pass = process.env.ADMIN_PASSWORD || "admin123";

  console.log("✅ Conectado. DB:", mongoose.connection.name);
  console.log("Seedeando admin:", email);

  const passwordHash = await bcrypt.hash(pass, 10);

  await User.findOneAndUpdate(
    { email },
    { email, passwordHash, role: "admin", name: "Admin" },
    { upsert: true, new: true }
  );

  console.log("✅ Admin creado/actualizado:", email, "pass:", pass);
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});
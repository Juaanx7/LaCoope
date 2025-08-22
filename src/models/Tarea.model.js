import mongoose from "mongoose";

export const ESTADOS = ["pending", "in_progress", "done"];
export const PRIORIDADES = ["low", "med", "high"];

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

/* =========================
   🔧 Helpers UTC seguros
   ========================= */

// "YYYY-MM-DD" calculado en UTC (evita corrimientos por timezone)
function ymdUTC(dateInput = new Date()) {
  const d = new Date(dateInput);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// "YYYY-Www" (semana ISO) calculado en UTC
function getISOWeekStrUTC(dateInput = new Date()) {
  const d = new Date(dateInput);

  // mover al jueves de la semana ISO (todo en UTC)
  const day = (d.getUTCDay() + 6) % 7; // lunes=0..domingo=6
  d.setUTCDate(d.getUTCDate() - day + 3);

  // primer jueves del año (UTC)
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstThuDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThuDay + 3);

  const weekNo = 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
  const year = d.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, "0")}`;
}

/* =========================
   Schema
   ========================= */

const TareaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: "" },

    // Multi-área (guardamos slug para filtrar fácil)
    area: { type: String, required: true, lowercase: true, trim: true, index: true },

    status: { type: String, enum: ESTADOS, default: "pending", index: true },
    priority: { type: String, enum: PRIORIDADES, default: "med" },

    // Fecha real y semana ISO (derivadas de UTC)
    date: { type: Date, required: true },
    week: { type: String, required: true, index: true },

    notes: { type: String, trim: true, default: "" },

    // Compat con front actual: "YYYY-MM-DD"
    fechaSemana: { type: String, index: true },
  },
  { timestamps: true }
);

// Derivar campos usando UTC para evitar “corrimientos” de un día
TareaSchema.pre("validate", function (next) {
  if (!this.date) this.date = new Date(); // Date ISO

  // Normaliza área a slug por las dudas
  if (this.area) this.area = toSlug(this.area);

  // 🔐 Clave: derivar ambos en UTC
  this.fechaSemana = ymdUTC(this.date);      // "YYYY-MM-DD" (UTC)
  this.week = getISOWeekStrUTC(this.date);   // "YYYY-Www" (UTC)

  next();
});

TareaSchema.index({ area: 1, week: 1 });
TareaSchema.index({ area: 1, date: 1 });

export default mongoose.model("Tarea", TareaSchema);
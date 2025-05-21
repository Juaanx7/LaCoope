import mongoose from "mongoose";

const TareaSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  estado: {
    type: String,
    enum: ["pendiente", "en proceso", "finalizada"],
    default: "pendiente",
  },
  dia: {
    type: String,
    enum: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    required: true,
  },
  fechaSemana: { type: String, required: true }, // ejemplo: "2024-06-03"
  creadoEn: { type: Date, default: Date.now },
});

const Tarea = mongoose.model("Tarea", TareaSchema);
export default Tarea;
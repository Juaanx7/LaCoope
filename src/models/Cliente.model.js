import mongoose from "mongoose"; // ⬅ Cambiado a import

const ClienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  direccion: { type: String, required: true },
  plan: { type: String, required: true },
  mac: { type: String, required: true, unique: true },
  wifiSSID: { type: String, required: true },
  wifiPassword: { type: String, required: true },
  redPosicion: { type: String, required: true },
  ipModem: { type: String, required: true },
});

const Cliente = mongoose.model("Cliente", ClienteSchema);
export default Cliente;
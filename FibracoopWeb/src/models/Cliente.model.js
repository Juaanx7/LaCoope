const mongoose = require("mongoose");

const ClienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  direccion: { type: String, required: true },
  plan: { type: String, required: true },
  mac: { type: String, required: true, unique: true },
  wifiSSID: { type: String, required: true },
  wifiPassword: { type: String, required: true },
  redPosicion: { type: String, required: true }, // Ejemplo: "2/2/13"
  ipModem: { type: String, required: true },
});

const Cliente = mongoose.model("Cliente", ClienteSchema);
module.exports = Cliente;
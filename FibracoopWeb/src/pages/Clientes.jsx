import { useState } from "react";
import ClienteCard from "../components/ClienteCard";
import "../styles/Clientes.scss";

const clientes = [
  { 
    id: 1, nombre: "Juan Pérez", direccion: "Calle 123", plan: "100 Mbps", mac: "AA:BB:CC:DD:EE:FF",
    wifiSSID: "FibraCoop_123", wifiPassword: "contraseña123", redPosicion: "2/2/13", ipModem: "192.168.1.10"
  },
  { 
    id: 2, nombre: "María López", direccion: "Avenida 456", plan: "50 Mbps", mac: "11:22:33:44:55:66",
    wifiSSID: "FibraCoop_456", wifiPassword: "clave456", redPosicion: "3/1/5", ipModem: "192.168.1.11"
  },
  { 
    id: 3, nombre: "Carlos Díaz", direccion: "Boulevard 789", plan: "200 Mbps", mac: "77:88:99:AA:BB:CC",
    wifiSSID: "FibraCoop_789", wifiPassword: "secreta789", redPosicion: "1/4/7", ipModem: "192.168.1.12"
  },
];

function Clientes() {
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  return (
    <div className="clientes-container">
      <h1>Lista de Clientes</h1>
      <div className="clientes-list">
        {clientes.map((cliente) => (
          <ClienteCard key={cliente.id} cliente={cliente} onVerDetalle={() => setClienteSeleccionado(cliente)} />
        ))}
      </div>

      {/* Modal flotante para los detalles */}
      {clienteSeleccionado && (
        <div className="modal-overlay" onClick={() => setClienteSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{clienteSeleccionado.nombre}</h2>
            <p>📍 Dirección: {clienteSeleccionado.direccion}</p>
            <p>📡 Plan: {clienteSeleccionado.plan}</p>
            <p>🖧 MAC: {clienteSeleccionado.mac}</p>
            <p>📶 WiFi: {clienteSeleccionado.wifiSSID}</p>
            <p>🔑 Contraseña WiFi: {clienteSeleccionado.wifiPassword}</p>
            <p>🔌 Posición en red: {clienteSeleccionado.redPosicion}</p>
            <p>🌐 IP del módem: {clienteSeleccionado.ipModem}</p>
            <button className="close-btn" onClick={() => setClienteSeleccionado(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
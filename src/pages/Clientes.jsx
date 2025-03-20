import { useState, useEffect } from "react";
import ClienteCard from "../components/ClienteCard";
import "../styles/Clientes.scss";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("nombre");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [datosEditados, setDatosEditados] = useState({});
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    direccion: "",
    plan: "15",
    mac: "",
    wifiSSID: "",
    wifiPassword: "",
    redPosicion: "",
    ipModem: "",
    estado: "activo",
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/clientes")
      .then((res) => res.json())
      .then((data) => setClientes(data))
      .catch((error) => console.error("Error al obtener clientes:", error));
  }, []);

  const clientesFiltrados = clientes.filter((cliente) =>
    cliente[filtro]?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirModal = (cliente) => {
    setClienteSeleccionado(cliente);
    setDatosEditados({
      ...cliente,
      plan: cliente.plan.toString().replace(" mb", ""),
    });
  };  

  const handleChange = (e) => {
    const { name, value } = e.target;  
    setDatosEditados((prev) => ({
      ...prev,
      [name]: name === "plan" ? value : value,
    }));
  };  

  const handleNuevoClienteChange = (e) => {
    const { name, value } = e.target;
    setNuevoCliente((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardarCambios = async () => {
    if (!clienteSeleccionado) return;

    try {
      const response = await fetch(`http://localhost:5000/api/clientes/${datosEditados._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosEditados),
      });

      if (!response.ok) throw new Error("Error al actualizar el cliente");

      const clienteActualizado = await response.json();
      setClientes((prev) =>
        prev.map((c) => (c._id === clienteActualizado._id ? clienteActualizado : c))
      );

      alert("Cliente actualizado correctamente");
      setClienteSeleccionado(null);
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      alert("Hubo un error al actualizar el cliente");
    }
  };

  const handleCrearCliente = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoCliente),
      });

      if (!response.ok) throw new Error("Error al crear el cliente");

      const clienteCreado = await response.json();
      setClientes((prev) => [...prev, clienteCreado]);

      alert("Cliente creado correctamente");
      setNuevoCliente({
        nombre: "",
        direccion: "",
        plan: "15",
        mac: "",
        wifiSSID: "",
        wifiPassword: "",
        redPosicion: "",
        ipModem: "",
        estado: "activo",
      });
      setMostrarModalNuevo(false);
    } catch (error) {
      console.error("Error al crear cliente:", error);
      alert("Hubo un error al crear el cliente");
    }
  };

  const handleEliminarCliente = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este cliente?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/clientes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar el cliente");

      setClientes((prev) => prev.filter((cliente) => cliente._id !== id));
      alert("Cliente eliminado correctamente");
      setClienteSeleccionado(null);
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      alert("Hubo un error al eliminar el cliente");
    }
  };

  return (
    <div className="clientes-container">
      <h1>Lista de Clientes</h1>

      <div className="filtros">
        <input
          type="text"
          placeholder={`Buscar por ${filtro}...`}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select onChange={(e) => setFiltro(e.target.value)} value={filtro}>
          <option value="nombre">Nombre</option>
          <option value="direccion">Dirección</option>
          <option value="plan">Plan</option>
          <option value="estado">Estado</option>
        </select>

        <button className="add-btn" onClick={() => setMostrarModalNuevo(true)}>+ Agregar Cliente</button>
      </div>

      <div className="clientes-list">
        {clientesFiltrados.map((cliente) => (
          <ClienteCard key={cliente._id} cliente={cliente} onVerDetalle={() => abrirModal(cliente)} />
        ))}
      </div>

      {clienteSeleccionado && (
        <div className="modal-overlay" onClick={() => setClienteSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{datosEditados.nombre}</h2>

            <label>📍 Dirección:</label>
            <input type="text" name="direccion" value={datosEditados.direccion} onChange={handleChange} />

            <label>📡 Plan:</label>
            <select name="plan" value={datosEditados.plan} onChange={handleChange}>
              <option value="15">15 mb</option>
              <option value="30">30 mb</option>
              <option value="50">50 mb</option>
            </select>

            <label>🖧 MAC:</label>
            <input type="text" name="mac" value={datosEditados.mac} onChange={handleChange} />

            <label>📶 WiFi:</label>
            <input type="text" name="wifiSSID" value={datosEditados.wifiSSID} onChange={handleChange} />

            <label>🔑 Contraseña WiFi:</label>
            <input type="text" name="wifiPassword" value={datosEditados.wifiPassword} onChange={handleChange} />

            <label>🔌 Posición en red:</label>
            <input type="text" name="redPosicion" value={datosEditados.redPosicion} onChange={handleChange} />

            <label>🌐 IP del módem:</label>
            <input type="text" name="ipModem" value={datosEditados.ipModem} onChange={handleChange} />

            <label>⚡ Estado del servicio:</label>
            <select name="estado" value={datosEditados.estado} onChange={handleChange}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>

            <div className="modal-buttons">
              <button className="save-btn" onClick={handleGuardarCambios}>Guardar cambios</button>
              <button className="delete-btn" onClick={() => handleEliminarCliente(clienteSeleccionado._id)}>Eliminar Cliente</button>
              <button className="close-btn" onClick={() => setClienteSeleccionado(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal flotante para agregar un nuevo cliente */}
      {mostrarModalNuevo && (
        <div className="modal-overlay" onClick={() => setMostrarModalNuevo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Agregar Nuevo Cliente</h2>

            <label>Nombre:</label>
            <input type="text" name="nombre" value={nuevoCliente.nombre} onChange={handleNuevoClienteChange} />

            <label>📍 Dirección:</label>
            <input type="text" name="direccion" value={nuevoCliente.direccion} onChange={handleNuevoClienteChange} />

            <label>📡 Plan:</label>
            <select name="plan" value={nuevoCliente.plan} onChange={handleNuevoClienteChange}>
              <option value="15">15 mb</option>
              <option value="30">30 mb</option>
              <option value="50">50 mb</option>
            </select>

            <label>🖧 MAC:</label>
            <input type="text" name="mac" value={nuevoCliente.mac} onChange={handleNuevoClienteChange} />

            <label>📶 WiFi:</label>
            <input type="text" name="wifiSSID" value={nuevoCliente.wifiSSID} onChange={handleNuevoClienteChange} />

            <label>🔑 Contraseña WiFi:</label>
            <input type="text" name="wifiPassword" value={nuevoCliente.wifiPassword} onChange={handleNuevoClienteChange} />

            <label>🔌 Posición en red:</label>
            <input type="text" name="redPosicion" value={nuevoCliente.redPosicion} onChange={handleNuevoClienteChange} />

            <label>🌐 IP del módem:</label>
            <input type="text" name="ipModem" value={nuevoCliente.ipModem} onChange={handleNuevoClienteChange} />

            <label>⚡ Estado del servicio:</label>
            <select name="estado" value={nuevoCliente.estado} onChange={handleNuevoClienteChange}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>

            <div className="modal-buttons">
              <button className="save-btn" onClick={handleCrearCliente}>Crear Cliente</button>
              <button className="close-btn" onClick={() => setMostrarModalNuevo(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Clientes;
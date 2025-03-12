import { useState, useEffect } from "react";
import ClienteCard from "../components/ClienteCard";
import "../styles/Clientes.scss";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("nombre");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [datosEditados, setDatosEditados] = useState({}); // Estado para edición

  // 📌 Cargar los clientes desde la API
  useEffect(() => {
    fetch("http://localhost:5000/api/clientes")
      .then((res) => res.json())
      .then((data) => setClientes(data))
      .catch((error) => console.error("Error al obtener clientes:", error));
  }, []);

  // Filtrar clientes según la búsqueda y el filtro seleccionado
  const clientesFiltrados = clientes.filter((cliente) =>
    cliente[filtro]?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // 📌 Manejar la apertura del modal con datos editables
  const abrirModal = (cliente) => {
    setClienteSeleccionado(cliente);
    setDatosEditados({ ...cliente }); // Clonar los datos para edición
  };

  // 📌 Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosEditados((prev) => ({ ...prev, [name]: value }));
  };

  // 📌 Enviar los cambios al backend
  const guardarCambios = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/clientes/${datosEditados._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosEditados),
      });

      if (!res.ok) throw new Error("Error al actualizar el cliente");

      // Actualizar lista de clientes con la info editada
      setClientes((prev) =>
        prev.map((cliente) => (cliente._id === datosEditados._id ? datosEditados : cliente))
      );

      setClienteSeleccionado(null); // Cerrar el modal
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
    }
  };

  return (
    <div className="clientes-container">
      <h1>Lista de Clientes</h1>

      {/* Filtros y búsqueda */}
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
      </div>

      {/* Lista de clientes */}
      <div className="clientes-list">
        {clientesFiltrados.length > 0 ? (
          clientesFiltrados.map((cliente) => (
            <ClienteCard key={cliente._id} cliente={cliente} onVerDetalle={() => abrirModal(cliente)} />
          ))
        ) : (
          <p className="no-resultados">No se encontraron clientes.</p>
        )}
      </div>

      {/* Modal flotante para los detalles */}
      {clienteSeleccionado && (
        <div className="modal-overlay" onClick={() => setClienteSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{datosEditados.nombre}</h2>

            <label>📍 Dirección:</label>
            <input type="text" name="direccion" value={datosEditados.direccion} onChange={handleChange} />

            <label>📡 Plan:</label>
            <select name="plan" value={datosEditados.plan} onChange={handleChange}>
              <option value="15 mb">15 mb</option>
              <option value="30 mb">30 mb</option>
              <option value="50 mb">50 mb</option>
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

            {/* Botones de acción */}
            <div className="modal-buttons">
              <button onClick={guardarCambios}>Guardar</button>
              <button className="close-btn" onClick={() => setClienteSeleccionado(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
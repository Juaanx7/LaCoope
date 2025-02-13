import { useState } from "react";

function Clientes() {
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const clientes = [
    { id: 1, nombre: "Juan Pérez", plan: "100 Mbps", domicilio: "Calle Falsa 123" },
    { id: 2, nombre: "María López", plan: "50 Mbps", domicilio: "Av. Principal 456" },
    { id: 3, nombre: "Carlos Sánchez", plan: "200 Mbps", domicilio: "Ruta 9 Km 10" },
  ];

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Lista de Clientes</h2>
      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Plan</th>
            <th>Domicilio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id}>
              <td>{cliente.id}</td>
              <td>{cliente.nombre}</td>
              <td>{cliente.plan}</td>
              <td>{cliente.domicilio}</td>
              <td>
                <button onClick={() => setClienteSeleccionado(cliente)}>Ver Detalle</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mostrar detalles del cliente seleccionado */}
      {clienteSeleccionado && (
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc" }}>
          <h3>Detalles del Cliente</h3>
          <p><strong>Nombre:</strong> {clienteSeleccionado.nombre}</p>
          <p><strong>Plan:</strong> {clienteSeleccionado.plan}</p>
          <p><strong>Domicilio:</strong> {clienteSeleccionado.domicilio}</p>
          <button onClick={() => setClienteSeleccionado(null)}>Cerrar</button>
        </div>
      )}
    </div>
  );
}

export default Clientes;  
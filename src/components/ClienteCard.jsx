function ClienteCard({ cliente, onVerDetalle }) {
    return (
      <div className="cliente-card">
        <h3>{cliente.nombre}</h3>
        <p>📍 {cliente.direccion}</p>
        <p>📡 Plan: {cliente.plan}</p>
        <button onClick={onVerDetalle}>Ver detalle</button>
      </div>
    );
  }
  
  export default ClienteCard;  
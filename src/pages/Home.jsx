import "../styles/Home.scss";

function Home() {
  return (
    <div className="home-container">
      <h1>Bienvenido al Panel de Gestión de Internet</h1>
      <p>Aquí puedes administrar la información de los clientes y sus conexiones.</p>

      <div className="home-sections">
        <a href="/clientes" className="card">
          <h2>📋 Gestión de Clientes</h2>
          <p>Consulta, edita y administra la información de los clientes.</p>
        </a>

        <a href="/estadisticas" className="card">
          <h2>📡 Estadisticas</h2>
          <p>Revisa y gestiona el estado de las conexiones activas.</p>
        </a>

        <a href="/configuracion" className="card">
          <h2>⚙️ Configuración</h2>
          <p>Accede a herramientas de configuración y ajustes del sistema.</p>
        </a>
      </div>
    </div>
  );
}

export default Home;
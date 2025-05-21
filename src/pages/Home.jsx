import { useNavigate } from "react-router-dom";
import "../styles/Home.scss";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Bienvenido a la Plataforma de Servicios</h1>
      <div className="home-options">
        <button onClick={() => navigate("/fibracoop")}>Fibracoop</button>
        <button onClick={() => navigate("/velocoop")}>Velocoop</button>
        <button onClick={() => navigate("/trabajos")}>Trabajos diarios</button>
      </div>
    </div>
  );
}

export default Home;
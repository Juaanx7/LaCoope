import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import HomeFibracoop from "./pages/HomeFibracoop";
import Clientes from "./pages/Clientes";
import Navbar from "./components/Navbar";
import "./styles/main.scss";
import Configuracion from "./pages/Configuracion";
import Estadisticas from "./pages/Estadisticas";
import Tareas from "./pages/Tareas";
import Historial from "./pages/Historial";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/*Seccion Fibracoop*/}
        <Route path="/" element={<Home />} />
        <Route path="/fibracoop" element={<HomeFibracoop />} />
        <Route path="/fibracoop/clientes" element={<Clientes />} />
        <Route path="/fibracoop/estadisticas" element={<Estadisticas />} />

        {/*Seccion Velocoop*/}
        {/* <Route path="/velocoop" element={<HomeVelocoop />} /> */}
        {/* <Route path="/velocoop/clientes" element={<ClientesVelocoop />} /> */}

        {/*Seccion Tareas*/}
        <Route path="/trabajos" element={<Tareas />} />
        <Route path="/historial" element={<Historial />} />
      </Routes>
    </Router>
  );
}

export default App;
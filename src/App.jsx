import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Clientes from "./pages/Clientes";
import Navbar from "./components/Navbar";
import "./styles/main.scss";
import Configuracion from "./pages/Configuracion";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Routes>
    </Router>
  );
}

export default App;
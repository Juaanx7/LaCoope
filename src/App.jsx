import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./styles/main.scss";

import Tareas from "./pages/Tareas";
import Historial from "./pages/Historial";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Público */}
        <Route path="/login" element={<Login />} />

        {/* Protegido - Navbar solo aparece aquí */}
        <Route element={<ProtectedRoute />}>
          <Route element={<><Navbar /><Outlet /></>}>
            <Route path="/" element={<Tareas />} />
            <Route path="/tareas" element={<Tareas />} />
            <Route path="/historial" element={<Historial />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
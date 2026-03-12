import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./styles/main.scss";

import Tareas from "./pages/Tareas";
import Historial from "./pages/Historial";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

function App() {
  return (
    <Router>
      <Routes>
        {/* Público */}
        <Route path="/login" element={<Login />} />

        {/* Protegido */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Tareas />} />
            <Route path="/tareas" element={<Tareas />} />
            <Route path="/historial" element={<Historial />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
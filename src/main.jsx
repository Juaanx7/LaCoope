// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AreaProvider } from "./context/AreaContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./styles/tokens.scss";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AreaProvider>
        <App />
      </AreaProvider>
    </AuthProvider>
  </React.StrictMode>
);
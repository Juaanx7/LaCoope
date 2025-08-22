// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AreaProvider } from "./context/AreaContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AreaProvider>
      <App />
    </AreaProvider>
  </React.StrictMode>
);
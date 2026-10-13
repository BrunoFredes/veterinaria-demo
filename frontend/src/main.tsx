import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ToastProvider } from "./components/ui/ToastProvider";
import {
  aplicarEscalaVisual, aplicarTemaVisual, obtenerEscalaVisual, obtenerTemaVisual,
} from "./utils/preferencias";

aplicarEscalaVisual(obtenerEscalaVisual());
aplicarTemaVisual(obtenerTemaVisual());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);

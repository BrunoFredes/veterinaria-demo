import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import ClientesPage from "./pages/ClientesPage";
import ClienteDetallePage from "./pages/ClienteDetallePage";
import CajaPage from "./pages/CajaPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/clientes"
            element={<ClientesPage />}
          />

          <Route
            path="/clientes/:id"
            element={<ClienteDetallePage />}
          />

          <Route
            path="/caja"
            element={<CajaPage />}
          />

          <Route
            path="/configuracion"
            element={<ConfiguracionPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
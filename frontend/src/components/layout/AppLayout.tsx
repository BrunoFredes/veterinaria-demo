
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  useEffect(() => {
    cerrarMenu();
  }, [location.pathname]);

  useEffect(() => {
    if (!menuAbierto) return;

    function manejarTeclado(event: KeyboardEvent) {
      if (event.key === "Escape") {
        cerrarMenu();
      }
    }

    window.addEventListener("keydown", manejarTeclado);

    return () => {
      window.removeEventListener("keydown", manejarTeclado);
    };
  }, [menuAbierto]);

  useEffect(() => {
    if (!menuAbierto) return;

    const consultaMovil = window.matchMedia("(max-width: 760px)");

    if (!consultaMovil.matches) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [menuAbierto]);

  return (
    <div className="app-shell">
      {menuAbierto && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={cerrarMenu}
          aria-label="Cerrar menú de navegación"
        />
      )}

      <Sidebar isOpen={menuAbierto} onClose={cerrarMenu} />

      <div className="app-main">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-controls="app-sidebar"
          aria-expanded={menuAbierto}
        >
          <Menu size={22} />
        </button>

        <Header />

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;

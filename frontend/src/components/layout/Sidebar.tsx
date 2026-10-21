
import {
  Banknote,
  LayoutDashboard,
  PawPrint,
  Settings,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Clientes",
    path: "/clientes",
    icon: PawPrint,
  },
  {
    label: "Caja",
    path: "/caja",
    icon: Banknote,
  },
  {
    label: "Configuración",
    path: "/configuracion",
    icon: Settings,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside
      id="app-sidebar"
      className={`sidebar ${isOpen ? "sidebar-open" : ""}`}
      aria-label="Navegación principal"
    >
      <div className="sidebar-brand">
        <div className="brand-icon">
          <PawPrint size={22} />
        </div>

        <div>
          <span className="brand-name">Veterinaria</span>
          <span className="brand-subtitle">Gestión</span>
        </div>

        <button
          type="button"
          className="sidebar-close-button"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X size={21} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={onClose}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span>Gestión Veterinaria</span>
        <small>v1.0.0</small>
      </div>
    </aside>
  );
}

export default Sidebar;

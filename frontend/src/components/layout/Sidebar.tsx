import {
  Banknote,
  LayoutDashboard,
  PawPrint,
  Settings,
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

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <PawPrint size={22} />
        </div>

        <div>
          <span className="brand-name">Veterinaria</span>
          <span className="brand-subtitle">Gestión</span>
        </div>
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
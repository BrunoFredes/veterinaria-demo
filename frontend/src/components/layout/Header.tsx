import { Bell } from "lucide-react";

function Header() {
  return (
    <header className="app-header">
      <div>
        <span className="header-eyebrow">
          Administración
        </span>

        <h1>Panel de gestión</h1>
      </div>

      <button
        type="button"
        className="header-icon-button"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
      </button>
    </header>
  );
}

export default Header;
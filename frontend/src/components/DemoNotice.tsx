
import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

function DemoNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("demo-notice-seen");

    if (!alreadySeen) {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem("demo-notice-seen", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="demo-notice-overlay">
      <div
        className="demo-notice-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-notice-title"
      >
        <button
          className="demo-notice-close"
          onClick={handleClose}
          aria-label="Cerrar aviso"
        >
          <X size={20} />
        </button>

        <div className="demo-notice-icon">
          <Info size={26} />
        </div>

        <span className="demo-notice-label">
          VERSIÓN DEMOSTRACIÓN
        </span>

        <h2 id="demo-notice-title">
          Bienvenido a la versión demo
        </h2>

        <p>
          Estás utilizando una versión de demostración de un
          sistema de gestión veterinaria.
        </p>

        <div className="demo-notice-information">
          <p>
            Los datos disponibles son ficticios y se utilizan
            exclusivamente con fines demostrativos.
          </p>

          <p>
            Los registros y modificaciones que realices serán
            eliminados automáticamente cada 24 horas.
          </p>
        </div>

        <p className="demo-notice-warning">
          No ingreses información personal ni datos reales
          de clientes o pacientes.
        </p>

        <button
          className="demo-notice-button"
          onClick={handleClose}
        >
          Entendido, continuar
        </button>
      </div>
    </div>
  );
}

export default DemoNotice;

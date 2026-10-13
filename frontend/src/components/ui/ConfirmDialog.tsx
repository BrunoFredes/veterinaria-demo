
import { AlertTriangle, CheckCircle2, Info, LoaderCircle, X } from "lucide-react";
import { useEffect } from "react";

export type ConfirmVariant = "default" | "danger";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  details?: string;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  open,
  title,
  description,
  details,
  variant = "default",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const peligroso = variant === "danger";

  return (
    <div
      className="confirm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <button
          type="button"
          className="confirm-close"
          aria-label="Cerrar diálogo"
          onClick={onCancel}
          disabled={loading}
        >
          <X size={19} />
        </button>

        <div
          className={`confirm-icon ${
            peligroso ? "confirm-icon-danger" : "confirm-icon-default"
          }`}
        >
          {peligroso ? (
            <AlertTriangle size={25} />
          ) : (
            <Info size={25} />
          )}
        </div>

        <h3 id="confirm-dialog-title">{title}</h3>

        <p id="confirm-dialog-description">{description}</p>

        {details && (
          <div
            className={`confirm-details ${
              peligroso ? "confirm-details-danger" : ""
            }`}
          >
            {details}
          </div>
        )}

        <div className="confirm-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`button ${
              peligroso ? "confirm-button-danger" : "button-primary"
            }`}
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            {loading ? (
              <LoaderCircle size={16} className="confirm-spinner" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
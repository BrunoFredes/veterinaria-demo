import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { api } from "../../services/api";
import type { Trabajo } from "../../types/cuentaCorriente";

interface TrabajoFormModalProps {
  clienteId: number;
  onClose: () => void;
  onSaved: () => void;
}

function TrabajoFormModal({
  clienteId,
  onClose,
  onSaved,
}: TrabajoFormModalProps) {
  const [descripcion, setDescripcion] = useState("");
  const [total, setTotal] = useState("");
  const [fecha, setFecha] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const amount = Number(total);

    if (!descripcion.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("El importe debe ser un número entero mayor que cero.");
      return;
    }

    setSaving(true);

    try {
      await api.post<Trabajo>("/trabajos", {
        clienteId,
        descripcion: descripcion.trim(),
        total: amount,
        fecha: fecha
          ? new Date(`${fecha}T12:00:00`).toISOString()
          : undefined,
      });

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar el trabajo."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trabajo-form-title"
      >
        <header className="modal-header">
          <div>
            <span className="page-eyebrow">Cuenta corriente</span>
            <h3 id="trabajo-form-title">Registrar trabajo</h3>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar formulario"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-fields">
            <label className="form-field">
              <span>Descripción del trabajo *</span>
              <input
                autoFocus
                required
                maxLength={250}
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Ej. Consulta, cirugía, medicación..."
              />
            </label>

            <label className="form-field">
              <span>Importe total (ARS) *</span>
              <input
                required
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={total}
                onChange={(event) => setTotal(event.target.value)}
                placeholder="Ej. 25000"
              />
            </label>

            <label className="form-field">
              <span>Fecha del trabajo</span>
              <input
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
              />
            </label>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <footer className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="button button-primary"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Registrar trabajo"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default TrabajoFormModal;
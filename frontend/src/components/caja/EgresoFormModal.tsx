
import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { api } from "../../services/api";
import type {
  MedioPago,
  MovimientoCaja,
} from "../../types/movimientoCaja";

interface EgresoFormModalProps {
  onClose: () => void;
  onSaved: () => void;
}

const mediosPago: { value: MedioPago; label: string }[] = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
];

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function EgresoFormModal({ onClose, onSaved }: EgresoFormModalProps) {
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago>("EFECTIVO");
  const [fecha, setFecha] = useState(getToday());
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const amount = Number(monto);

    if (!concepto.trim()) {
      setError("El concepto del gasto es obligatorio.");
      return;
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("El importe debe ser un número entero mayor que cero.");
      return;
    }

    setSaving(true);

    try {
      await api.post<MovimientoCaja>("/movimientos", {
        tipo: "EGRESO",
        concepto: concepto.trim(),
        monto: amount,
        medioPago,
        fecha: fecha
          ? new Date(`${fecha}T12:00:00`).toISOString()
          : undefined,
        observaciones: observaciones.trim() || null,
      });

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar el egreso."
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
        aria-labelledby="egreso-form-title"
      >
        <header className="modal-header">
          <div>
            <span className="page-eyebrow">Control financiero</span>
            <h3 id="egreso-form-title">Registrar egreso</h3>
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
              <span>Concepto del gasto *</span>
              <input
                autoFocus
                required
                maxLength={200}
                value={concepto}
                onChange={(event) => setConcepto(event.target.value)}
                placeholder="Ej. Compra de medicamentos"
              />
            </label>

            <label className="form-field">
              <span>Importe (ARS) *</span>
              <input
                required
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={monto}
                onChange={(event) => setMonto(event.target.value)}
                placeholder="Ej. 30000"
              />
            </label>

            <label className="form-field">
              <span>Medio de pago *</span>
              <select
                required
                value={medioPago}
                onChange={(event) =>
                  setMedioPago(event.target.value as MedioPago)
                }
              >
                {mediosPago.map((medio) => (
                  <option key={medio.value} value={medio.value}>
                    {medio.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Fecha del gasto</span>
              <input
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Observaciones</span>
              <textarea
                rows={3}
                maxLength={500}
                value={observaciones}
                onChange={(event) =>
                  setObservaciones(event.target.value)
                }
                placeholder="Información adicional (opcional)"
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
              {saving ? "Guardando..." : "Registrar egreso"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default EgresoFormModal;
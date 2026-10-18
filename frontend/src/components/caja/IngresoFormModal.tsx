
import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { api } from "../../services/api";
import type { MovimientoCaja } from "../../types/movimientoCaja";
import { useToast } from "../ui/ToastProvider";

interface IngresoFormModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);

export default function IngresoFormModal({
  onClose,
  onSaved,
}: IngresoFormModalProps) {
  const [concepto, setConcepto] = useState("Aporte del dueño para caja");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(getToday());
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const amount = Number(monto);

    if (!concepto.trim()) {
      setError("El concepto del ingreso es obligatorio.");
      return;
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("El importe debe ser un número entero mayor que cero.");
      return;
    }

    setSaving(true);

    try {
      await api.post<MovimientoCaja>("/movimientos", {
        tipo: "INGRESO",
        concepto: concepto.trim(),
        monto: amount,
        medioPago: "EFECTIVO",
        fecha: fecha
          ? new Date(`${fecha}T12:00:00`).toISOString()
          : undefined,
        observaciones: observaciones.trim() || null,
      });

      showToast(
        `Ingreso de ${formatMoney(amount)} registrado correctamente.`,
        "success",
      );

      onSaved();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo registrar el ingreso.";

      setError(message);
      showToast(message, "error");
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
        aria-labelledby="ingreso-form-title"
      >
        <header className="modal-header">
          <div>
            <span className="page-eyebrow">Control financiero</span>
            <h3 id="ingreso-form-title">Ingresar dinero a la caja</h3>
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
              <span>Concepto *</span>
              <input
                autoFocus
                required
                maxLength={200}
                value={concepto}
                onChange={(event) => setConcepto(event.target.value)}
                placeholder="Ej. Aporte del dueño para cambio"
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
                placeholder="Ej. 20000"
              />
            </label>

            <label className="form-field">
              <span>Fecha del ingreso *</span>
              <input
                required
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
              />
            </label>

            <div className="form-field">
              <span>Medio</span>
              <input value="Efectivo" readOnly />
              <small>
                Este importe se suma al dinero físico disponible.
              </small>
            </div>

            <label className="form-field">
              <span>Observaciones</span>
              <textarea
                rows={3}
                maxLength={500}
                value={observaciones}
                onChange={(event) => setObservaciones(event.target.value)}
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
              {saving ? "Guardando..." : "Ingresar dinero"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
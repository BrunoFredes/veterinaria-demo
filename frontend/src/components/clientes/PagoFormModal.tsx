import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { api } from "../../services/api";
import type { Pago, Trabajo } from "../../types/cuentaCorriente";

interface PagoFormModalProps {
  trabajo: Trabajo;
  onClose: () => void;
  onSaved: () => void;
}

const mediosPago = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
] as const;

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);

function PagoFormModal({
  trabajo,
  onClose,
  onSaved,
}: PagoFormModalProps) {
  const saldoPendiente = Math.max(0, trabajo.deuda);

  const [monto, setMonto] = useState(String(saldoPendiente));
  const [medioPago, setMedioPago] = useState<string>("EFECTIVO");
  const [fecha, setFecha] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const amount = Number(monto);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("El importe debe ser un número entero mayor que cero.");
      return;
    }

    if (amount > saldoPendiente) {
      setError(
        `El cobro supera el saldo pendiente de ${formatMoney(saldoPendiente)}.`
      );
      return;
    }

    setSaving(true);

    try {
      await api.post<Pago>("/pagos", {
        trabajoId: trabajo.id,
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
          : "No se pudo registrar el pago."
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
        aria-labelledby="pago-form-title"
      >
        <header className="modal-header">
          <div>
            <span className="page-eyebrow">Cuenta corriente</span>
            <h3 id="pago-form-title">Registrar cobro</h3>
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

        <div className="payment-context">
          <span>Trabajo</span>
          <strong>{trabajo.descripcion}</strong>

          <div>
            <span>Saldo pendiente</span>
            <strong>{formatMoney(saldoPendiente)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-fields">
            <label className="form-field">
              <span>Importe a cobrar (ARS) *</span>
              <input
                autoFocus
                required
                type="number"
                min="1"
                max={saldoPendiente}
                step="1"
                inputMode="numeric"
                value={monto}
                onChange={(event) => setMonto(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Medio de pago *</span>
              <select
                value={medioPago}
                onChange={(event) => setMedioPago(event.target.value)}
                required
              >
                {mediosPago.map((medio) => (
                  <option key={medio.value} value={medio.value}>
                    {medio.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Fecha del cobro</span>
              <input
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Observaciones</span>
              <textarea
                rows={2}
                maxLength={500}
                value={observaciones}
                onChange={(event) =>
                  setObservaciones(event.target.value)
                }
                placeholder="Detalle opcional del cobro"
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
              disabled={saving || saldoPendiente <= 0}
            >
              {saving ? "Registrando..." : "Confirmar cobro"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default PagoFormModal;
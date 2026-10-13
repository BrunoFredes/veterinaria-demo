
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  FilePlus2,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";

import TrabajoFormModal from "../components/clientes/TrabajoFormModal";
import PagoFormModal from "../components/clientes/PagoFormModal";
import { api } from "../services/api";
import type {
  ClienteResumen,
  Trabajo,
} from "../types/cuentaCorriente";


const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const estadoTrabajo: Record<
  Trabajo["estado"],
  { label: string; className: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    className: "status-pending",
  },
  PAGO_PARCIAL: {
    label: "Pago parcial",
    className: "status-partial",
  },
  PAGADO: {
    label: "Pagado",
    className: "status-paid",
  },
};

function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const clienteId = Number(id);

  const [cliente, setCliente] = useState<ClienteResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [trabajoModalOpen, setTrabajoModalOpen] = useState(false);
  const [trabajoParaCobrar, setTrabajoParaCobrar] =
    useState<Trabajo | null>(null);

  const loadCliente = useCallback(async () => {
    if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
      setError("El identificador del cliente no es válido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.get<ClienteResumen>(
        `/clientes/${clienteId}/resumen`
      );

      setCliente(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la cuenta corriente."
      );
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    void loadCliente();
  }, [loadCliente]);

  async function handleSaved() {
    setTrabajoModalOpen(false);
    setTrabajoParaCobrar(null);
    await loadCliente();
  }

  if (loading && !cliente) {
    return (
      <section className="page">
        <div className="loading-state">
          <span>Cargando cuenta corriente...</span>
        </div>
      </section>
    );
  }

  if (error && !cliente) {
    return (
      <section className="page">
        <Link to="/clientes" className="back-link">
          <ArrowLeft size={17} />
          Volver a clientes
        </Link>

        <div className="alert-error detail-error" role="alert">
          <div>
            <strong>No se pudo cargar el cliente</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => void loadCliente()}
          >
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  if (!cliente) {
    return null;
  }

  const datosCliente = cliente.cliente;
  const resumen = cliente.resumen;

  const trabajos = [...cliente.trabajos].sort(
    (a, b) =>
      new Date(b.fecha).getTime() -
      new Date(a.fecha).getTime()
  );

  const pagos = trabajos
    .flatMap((trabajo) =>
      trabajo.pagos.map((pago) => ({
        ...pago,
        descripcionTrabajo: trabajo.descripcion,
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.fecha).getTime() -
        new Date(a.fecha).getTime()
    )
    .slice(0, 10);

  return (
    <section className="page">
      <Link to="/clientes" className="back-link">
        <ArrowLeft size={17} />
        Volver a clientes
      </Link>

      <div className="page-heading client-detail-heading">
        <div>
          <span className="page-eyebrow">
            Clientes / Cuenta corriente
          </span>

          <h2>{datosCliente.nombre}</h2>

          <p>
            {datosCliente.telefono || "Sin teléfono registrado"}
            {datosCliente.direccion
              ? ` · ${datosCliente.direccion}`
              : ""}
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => setTrabajoModalOpen(true)}
        >
          <Plus size={18} />
          Nuevo trabajo
        </button>
      </div>

      {error && (
        <div className="alert-error" role="alert">
          <div>
            <strong>No se pudo actualizar la información</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => void loadCliente()}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="account-metrics">
        <article className="account-metric">
          <div className="account-metric-icon billed">
            <Receipt size={20} />
          </div>

          <span>Total facturado</span>
          <strong>{formatMoney(resumen.totalFacturado)}</strong>
        </article>

        <article className="account-metric">
          <div className="account-metric-icon collected">
            <Wallet size={20} />
          </div>

          <span>Total cobrado</span>
          <strong>{formatMoney(resumen.totalPagado)}</strong>
        </article>

        <article className="account-metric">
          <div className="account-metric-icon owed">
            <CircleAlert size={20} />
          </div>

          <span>Deuda pendiente</span>
          <strong>{formatMoney(resumen.deuda)}</strong>
        </article>
      </div>

      <section className="panel account-status-panel">
        <div className="account-status-icon">
          {resumen.estado === "AL_DIA" ? (
            <CheckCircle2 size={20} />
          ) : (
            <Clock3 size={20} />
          )}
        </div>

        <div>
          <strong>
            {resumen.estado === "AL_DIA"
              ? "Cuenta al día"
              : "Cuenta con saldo pendiente"}
          </strong>

          <p>
            {resumen.estado === "AL_DIA"
              ? "Este cliente no tiene deuda pendiente registrada."
              : "Hay importes pendientes de cobro en uno o más trabajos."}
          </p>
        </div>
      </section>

      <section className="panel account-work-panel">
        <div className="panel-heading">
          <div>
            <h3>Trabajos y servicios</h3>
            <p>
              {trabajos.length}{" "}
              {trabajos.length === 1
                ? "trabajo registrado"
                : "trabajos registrados"}
            </p>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => setTrabajoModalOpen(true)}
          >
            <FilePlus2 size={16} />
            Registrar trabajo
          </button>
        </div>

        {trabajos.length === 0 ? (
          <div className="clients-empty">
            <div className="clients-empty-icon">
              <Receipt size={25} />
            </div>

            <h3>Sin trabajos registrados</h3>

            <p>
              Registrá una consulta, servicio o tratamiento para comenzar
              a llevar la cuenta corriente de este cliente.
            </p>

            <button
              type="button"
              className="button button-primary"
              onClick={() => setTrabajoModalOpen(true)}
            >
              <Plus size={17} />
              Nuevo trabajo
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table account-work-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Total</th>
                  <th>Pagado</th>
                  <th>Pendiente</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {trabajos.map((trabajo) => {
                  const status = estadoTrabajo[trabajo.estado];

                  return (
                    <tr key={trabajo.id}>
                      <td>{formatDate(trabajo.fecha)}</td>

                      <td>
                        <strong className="work-description">
                          {trabajo.descripcion}
                        </strong>
                      </td>

                      <td>{formatMoney(trabajo.total)}</td>
                      <td>{formatMoney(trabajo.pagado)}</td>

                      <td>
                        <strong
                          className={
                            trabajo.deuda > 0
                              ? "debt-amount"
                              : "paid-amount"
                          }
                        >
                          {formatMoney(trabajo.deuda)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td>
                        {trabajo.deuda > 0 ? (
                          <button
                            type="button"
                            className="button button-small button-primary"
                            onClick={() =>
                              setTrabajoParaCobrar(trabajo)
                            }
                          >
                            Cobrar
                          </button>
                        ) : (
                          <span className="fully-paid-label">
                            <CheckCircle2 size={15} />
                            Completo
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel account-payments-panel">
        <div className="panel-heading">
          <div>
            <h3>Historial de cobros</h3>
            <p>Los últimos 10 pagos registrados</p>
          </div>

          <CreditCard size={19} />
        </div>

        {pagos.length === 0 ? (
          <div className="panel-empty">
            Todavía no hay pagos registrados para este cliente.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Trabajo</th>
                  <th>Medio de pago</th>
                  <th>Observaciones</th>
                  <th>Importe</th>
                </tr>
              </thead>

              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{formatDate(pago.fecha)}</td>
                    <td>{pago.descripcionTrabajo}</td>
                    <td>{pago.medioPago}</td>
                    <td>{pago.observaciones || "—"}</td>

                    <td>
                      <strong className="paid-amount">
                        {formatMoney(pago.monto)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {datosCliente.observaciones && (
        <section className="panel client-notes-panel">
          <h3>Observaciones del cliente</h3>
          <p>{datosCliente.observaciones}</p>
        </section>
      )}

      {trabajoModalOpen && (
        <TrabajoFormModal
          clienteId={datosCliente.id}
          onClose={() => setTrabajoModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {trabajoParaCobrar && (
        <PagoFormModal
          trabajo={trabajoParaCobrar}
          onClose={() => setTrabajoParaCobrar(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}

export default ClienteDetallePage;
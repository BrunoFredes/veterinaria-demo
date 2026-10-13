
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/ToastProvider";

interface DashboardData {
  clientes: {
    total: number;
    alDia: number;
    deudores: number;
  };
  trabajos: {
    totalFacturado: number;
    totalPagado: number;
    totalDeuda: number;
  };
  caja: {
    totalIngresos: number;
    totalEgresos: number;
    saldo: number;
    ingresosPorMedio: {
      efectivo: number;
      transferencia: number;
      tarjeta: number;
    };
    egresosPorMedio: {
      efectivo: number;
      transferencia: number;
      tarjeta: number;
    };
  };
}

const formatoPesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function pesos(monto: number): string {
  return formatoPesos.format(monto);
}

const mediosPago = [
  { key: "efectivo", label: "Efectivo" },
  { key: "transferencia", label: "Transferencia" },
  { key: "tarjeta", label: "Tarjeta" },
] as const;

export default function DashboardPage() {
  const [datos, setDatos] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarDashboard() {
      try {
        setCargando(true);
        setError("");

        const respuesta = await api.get<DashboardData>("/dashboard");

        if (activo) {
          setDatos(respuesta);
        }
      } catch {
        if (activo) {
          setError(
            "No se pudieron cargar los datos. Verificá que el backend esté funcionando e intentá nuevamente.",
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void cargarDashboard();

    return () => {
      activo = false;
    };
  }, []);

  if (cargando) {
    return (
      <main className="page dashboard-page">
        <div className="loading-state">Cargando dashboard...</div>
      </main>
    );
  }

  if (error || !datos) {
    return (
      <main className="page dashboard-page">
        <div className="page-heading">
          <div>
            <p className="page-eyebrow">Resumen general</p>
            <h1>Dashboard</h1>
          </div>
        </div>

        <div className="alert-error dashboard-error">
          {error || "No hay datos disponibles."}
        </div>

        <button
          className="button button-primary"
          onClick={() => window.location.reload()}
          type="button"
        >
          Reintentar
        </button>
      </main>
    );
  }

  const { clientes, trabajos, caja } = datos;
  const maximoMedioPago = Math.max(
    caja.ingresosPorMedio.efectivo,
    caja.ingresosPorMedio.transferencia,
    caja.ingresosPorMedio.tarjeta,
    caja.egresosPorMedio.efectivo,
    caja.egresosPorMedio.transferencia,
    caja.egresosPorMedio.tarjeta,
    1,
  );

  const porcentaje = (valor: number) =>
    Math.max(0, Math.min(100, (valor / maximoMedioPago) * 100));

  const porcentajeClientesAlDia =
    clientes.total > 0 ? (clientes.alDia / clientes.total) * 100 : 0;

  return (
    <main className="page dashboard-page">
      <header className="page-heading dashboard-heading">
        <div>
          <p className="page-eyebrow">Panel de control</p>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Un vistazo al estado de los clientes, los trabajos y la caja.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to="/clientes" className="button button-secondary">
            Ver clientes
          </Link>
          <Link to="/caja" className="button button-primary">
            Ir a caja
          </Link>
        </div>
      </header>

      <section className="dashboard-section" aria-labelledby="finanzas-title">
        <div className="dashboard-section-heading">
          <div>
            <p className="page-eyebrow">Finanzas</p>
            <h2 id="finanzas-title">Resumen económico</h2>
          </div>
        </div>

        <div className="dashboard-metrics">
          <article className="dashboard-metric">
            <div className="dashboard-metric-top">
              <span className="dashboard-metric-label">Total facturado</span>
              <span className="dashboard-metric-icon">↗</span>
            </div>
            <strong>{pesos(trabajos.totalFacturado)}</strong>
            <span className="dashboard-metric-caption">
              Importe de todos los trabajos
            </span>
          </article>

          <article className="dashboard-metric">
            <div className="dashboard-metric-top">
              <span className="dashboard-metric-label">Total cobrado</span>
              <span className="dashboard-metric-icon">✓</span>
            </div>
            <strong className="dashboard-positive">
              {pesos(trabajos.totalPagado)}
            </strong>
            <span className="dashboard-metric-caption">
              Pagos registrados de clientes
            </span>
          </article>

          <article className="dashboard-metric">
            <div className="dashboard-metric-top">
              <span className="dashboard-metric-label">Deuda pendiente</span>
              <span className="dashboard-metric-icon">◷</span>
            </div>
            <strong
              className={
                trabajos.totalDeuda > 0
                  ? "dashboard-warning"
                  : "dashboard-positive"
              }
            >
              {pesos(trabajos.totalDeuda)}
            </strong>
            <span className="dashboard-metric-caption">
              Saldo que deben los clientes
            </span>
          </article>

          <article className="dashboard-metric dashboard-metric-highlight">
            <div className="dashboard-metric-top">
              <span className="dashboard-metric-label">Saldo de caja</span>
              <span className="dashboard-metric-icon">＄</span>
            </div>
            <strong
              className={
                caja.saldo < 0 ? "dashboard-negative" : "dashboard-positive"
              }
            >
              {pesos(caja.saldo)}
            </strong>
            <span className="dashboard-metric-caption">
              Ingresos menos egresos registrados
            </span>
          </article>
        </div>
      </section>

      <section className="dashboard-lower-grid">
        <article className="panel dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="page-eyebrow">Cartera de clientes</p>
              <h2>Estado de clientes</h2>
            </div>
            <Link to="/clientes" className="dashboard-text-link">
              Ver listado →
            </Link>
          </div>

          <div className="dashboard-client-total">
            <strong>{clientes.total}</strong>
            <span>
              {clientes.total === 1 ? "cliente registrado" : "clientes registrados"}
            </span>
          </div>

          <div className="dashboard-client-bar" aria-label="Proporción de clientes al día y deudores">
            <div
              className="dashboard-client-bar-paid"
              style={{ width: `${porcentajeClientesAlDia}%` }}
            />
          </div>

          <div className="dashboard-client-legend">
            <div>
              <span className="dashboard-legend-dot dashboard-dot-paid" />
              <span>Al día</span>
              <strong>{clientes.alDia}</strong>
            </div>
            <div>
              <span className="dashboard-legend-dot dashboard-dot-debt" />
              <span>Deudores</span>
              <strong>{clientes.deudores}</strong>
            </div>
          </div>

          {clientes.deudores > 0 ? (
            <div className="dashboard-notice dashboard-notice-warning">
              Hay {clientes.deudores}{" "}
              {clientes.deudores === 1
                ? "cliente con deuda pendiente."
                : "clientes con deudas pendientes."}
            </div>
          ) : (
            <div className="dashboard-notice dashboard-notice-success">
              Todos los clientes están al día.
            </div>
          )}
        </article>

        <article className="panel dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="page-eyebrow">Movimientos</p>
              <h2>Resumen de caja</h2>
            </div>
            <Link to="/caja" className="dashboard-text-link">
              Ver caja →
            </Link>
          </div>

          <div className="dashboard-cash-summary">
            <div>
              <span>Ingresos</span>
              <strong className="dashboard-positive">
                {pesos(caja.totalIngresos)}
              </strong>
            </div>
            <div>
              <span>Egresos</span>
              <strong className="dashboard-negative">
                {pesos(caja.totalEgresos)}
              </strong>
            </div>
          </div>

          <div className="dashboard-cash-balance">
            <span>Saldo neto</span>
            <strong
              className={
                caja.saldo < 0 ? "dashboard-negative" : "dashboard-positive"
              }
            >
              {pesos(caja.saldo)}
            </strong>
          </div>
        </article>
      </section>

      <section className="panel dashboard-payment-panel">
        <div className="panel-heading">
          <div>
            <p className="page-eyebrow">Medios de pago</p>
            <h2>Ingresos y egresos por medio</h2>
          </div>
        </div>

        <div className="dashboard-payment-legend">
          <span>
            <i className="dashboard-legend-dot dashboard-dot-income" />
            Ingresos
          </span>
          <span>
            <i className="dashboard-legend-dot dashboard-dot-expense" />
            Egresos
          </span>
        </div>

        <div className="dashboard-payment-list">
          {mediosPago.map((medio) => {
            const ingresos = caja.ingresosPorMedio[medio.key];
            const egresos = caja.egresosPorMedio[medio.key];

            return (
              <div className="dashboard-payment-row" key={medio.key}>
                <div className="dashboard-payment-name">{medio.label}</div>

                <div className="dashboard-payment-bars">
                  <div className="dashboard-payment-bar-track">
                    <div
                      className="dashboard-payment-bar dashboard-payment-bar-income"
                      style={{ width: `${porcentaje(ingresos)}%` }}
                    />
                  </div>
                  <div className="dashboard-payment-bar-track">
                    <div
                      className="dashboard-payment-bar dashboard-payment-bar-expense"
                      style={{ width: `${porcentaje(egresos)}%` }}
                    />
                  </div>
                </div>

                <div className="dashboard-payment-values">
                  <span className="dashboard-positive">{pesos(ingresos)}</span>
                  <span className="dashboard-negative">{pesos(egresos)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="dashboard-footnote">
          Las barras comparan los importes entre medios de pago. Los valores
          corresponden a todos los movimientos registrados.
        </p>
      </section>
    </main>
  );
}
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CircleAlert,
  Clock3,
  PawPrint,
  RefreshCw,
  Wallet,
} from "lucide-react";

import { api } from "../services/api";
import type {
  DashboardData,
  Movimiento,
} from "../types/dashboard";

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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [movimientos, setMovimientos] =
    useState<Movimiento[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const [dashboardData, movimientosData] =
        await Promise.all([
          api.get<DashboardData>("/dashboard"),
          api.get<Movimiento[]>("/movimientos"),
        ]);

      setDashboard(dashboardData);
      setMovimientos(movimientosData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los datos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const metrics = dashboard
    ? [
        {
          label: "Saldo en caja",
          value: formatMoney(dashboard.caja.saldo),
          detail: "Ingresos menos egresos",
          icon: Wallet,
          color: "green",
        },
        {
          label: "Ingresos",
          value: formatMoney(dashboard.caja.totalIngresos),
          detail: "Total de cobros registrados",
          icon: ArrowDownRight,
          color: "blue",
        },
        {
          label: "Egresos",
          value: formatMoney(dashboard.caja.totalEgresos),
          detail: "Total de gastos registrados",
          icon: ArrowUpRight,
          color: "orange",
        },
        {
          label: "Deuda pendiente",
          value: formatMoney(dashboard.trabajos.totalDeuda),
          detail: `${dashboard.clientes.deudores} clientes con deuda`,
          icon: CircleAlert,
          color: "red",
        },
      ]
    : [];

  const recentMovements = [...movimientos]
    .sort(
      (a, b) =>
        new Date(b.fecha).getTime() -
        new Date(a.fecha).getTime()
    )
    .slice(0, 5);

  return (
    <section className="page">
      <div className="page-heading dashboard-heading">
        <div>
          <span className="page-eyebrow">Inicio</span>
          <h2>Dashboard</h2>
          <p>
            Resumen financiero y administrativo de la veterinaria.
          </p>
        </div>

        <button
          type="button"
          className="button button-secondary"
          onClick={() => void loadDashboard()}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="alert-error" role="alert">
          <CircleAlert size={18} />
          <div>
            <strong>No se pudieron cargar los datos</strong>
            <p>{error}</p>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void loadDashboard()}
          >
            Reintentar
          </button>
        </div>
      )}

      {loading && !dashboard ? (
        <div className="loading-state">
          <RefreshCw size={22} className="spin" />
          <span>Cargando información...</span>
        </div>
      ) : dashboard ? (
        <>
          <div className="metrics-grid">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <article className="metric-card" key={metric.label}>
                  <div className="metric-card-top">
                    <span className="metric-label">
                      {metric.label}
                    </span>

                    <div className={`metric-icon ${metric.color}`}>
                      <Icon size={20} />
                    </div>
                  </div>

                  <strong className="metric-value">
                    {metric.value}
                  </strong>

                  <span className="metric-detail">
                    {metric.detail}
                  </span>
                </article>
              );
            })}
          </div>

          <div className="dashboard-lower-grid">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Movimientos recientes</h3>
                  <p>Últimos ingresos y egresos registrados</p>
                </div>

                <Clock3 size={19} />
              </div>

              {recentMovements.length === 0 ? (
                <div className="panel-empty">
                  Todavía no hay movimientos registrados.
                </div>
              ) : (
                <div className="movement-list">
                  {recentMovements.map((movement) => {
                    const isIncome = movement.tipo === "INGRESO";

                    return (
                      <div
                        className="movement-row"
                        key={movement.id}
                      >
                        <div
                          className={`movement-icon ${
                            isIncome ? "income" : "expense"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownRight size={18} />
                          ) : (
                            <ArrowUpRight size={18} />
                          )}
                        </div>

                        <div className="movement-info">
                          <strong>{movement.concepto}</strong>
                          <span>
                            {formatDate(movement.fecha)} ·{" "}
                            {movement.medioPago}
                          </span>
                        </div>

                        <strong
                          className={`movement-amount ${
                            isIncome ? "income-text" : "expense-text"
                          }`}
                        >
                          {isIncome ? "+" : "−"}
                          {formatMoney(movement.monto)}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Estado de clientes</h3>
                  <p>Resumen de cuentas corrientes</p>
                </div>

                <PawPrint size={19} />
              </div>

              <div className="client-summary-total">
                <span>Total de clientes</span>
                <strong>{dashboard.clientes.total}</strong>
              </div>

              <div className="client-summary-row">
                <span>
                  <span className="status-dot green-dot" />
                  Al día
                </span>
                <strong>{dashboard.clientes.alDia}</strong>
              </div>

              <div className="client-summary-row">
                <span>
                  <span className="status-dot red-dot" />
                  Con deuda
                </span>
                <strong>{dashboard.clientes.deudores}</strong>
              </div>

              <div className="client-summary-footer">
                <Banknote size={17} />
                <span>
                  Total facturado:{" "}
                  <strong>
                    {formatMoney(dashboard.trabajos.totalFacturado)}
                  </strong>
                </span>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default DashboardPage;

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowDownToLine,
  CalendarDays,
  CircleAlert,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";

import EgresoFormModal from "../components/caja/EgresoFormModal";
import IngresoFormModal from "../components/caja/IngresoFormModal";
import { api } from "../services/api";
import type {
  MedioPago,
  MovimientoCaja,
  TipoMovimiento,
} from "../types/movimientoCaja";

type FiltroTipo = "TODOS" | TipoMovimiento;
type FiltroMedio = "TODOS" | MedioPago;

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getDateKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getToday() {
  return getDateKey(new Date().toISOString());
}

const medioPagoLabel: Record<MedioPago, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
};

function CajaPage() {
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("TODOS");
  const [filtroMedio, setFiltroMedio] = useState<FiltroMedio>("TODOS");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  
const [ingresoModalOpen, setIngresoModalOpen] = useState(false);
const [efectivoActual, setEfectivoActual] = useState(0);

const loadEfectivo = useCallback(async () => {
  try {
    const respuesta = await api.get<{ saldo: number }>("/movimientos/efectivo");
    setEfectivoActual(respuesta.saldo);
  } catch (err) {
    console.error("No se pudo cargar el efectivo actual:", err);
  }
}, []);

  const [egresoModalOpen, setEgresoModalOpen] = useState(false);

  const loadMovimientos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.get<MovimientoCaja[]>("/movimientos");
      setMovimientos(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los movimientos de caja."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMovimientos();
    void loadEfectivo();
  }, [loadMovimientos, loadEfectivo]);

  const movimientosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLocaleLowerCase("es-AR");

    return [...movimientos]
      .filter((movimiento) => {
        if (filtroTipo !== "TODOS" && movimiento.tipo !== filtroTipo) {
          return false;
        }

        if (
          filtroMedio !== "TODOS" &&
          movimiento.medioPago !== filtroMedio
        ) {
          return false;
        }

        const fechaMovimiento = getDateKey(movimiento.fecha);

        if (fechaDesde && fechaMovimiento < fechaDesde) return false;
        if (fechaHasta && fechaMovimiento > fechaHasta) return false;

        if (term) {
          const texto = [
            movimiento.concepto,
            movimiento.observaciones ?? "",
            movimiento.pago?.trabajo?.descripcion ?? "",
            movimiento.pago?.trabajo?.cliente?.nombre ?? "",
            medioPagoLabel[movimiento.medioPago],
          ]
            .join(" ")
            .toLocaleLowerCase("es-AR");

          if (!texto.includes(term)) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.fecha).getTime() -
          new Date(a.fecha).getTime()
      );
  }, [
    movimientos,
    busqueda,
    filtroTipo,
    filtroMedio,
    fechaDesde,
    fechaHasta,
  ]);

  const resumen = useMemo(() => {
    return movimientosFiltrados.reduce(
      (acc, movimiento) => {
        if (movimiento.tipo === "INGRESO") {
          acc.ingresos += movimiento.monto;
        } else {
          acc.egresos += movimiento.monto;
        }

        return acc;
      },
      { ingresos: 0, egresos: 0 }
    );
  }, [movimientosFiltrados]);

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroTipo("TODOS");
    setFiltroMedio("TODOS");
    setFechaDesde("");
    setFechaHasta("");
  }

  
  async function handleEgresoSaved() {
    setEgresoModalOpen(false);
    await Promise.all([loadMovimientos(), loadEfectivo()]);
  }

  async function handleIngresoSaved() {
    setIngresoModalOpen(false);
    await Promise.all([loadMovimientos(), loadEfectivo()]);
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">Administración financiera</span>
          <h2>Caja</h2>
          <p>
            Controlá los ingresos, egresos y movimientos de la veterinaria.
          </p>
        </div>

        
        <div className="cash-page-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setIngresoModalOpen(true)}
          >
            <ArrowDownToLine size={18} />
            Ingresar dinero
          </button>

          <button
            type="button"
            className="button button-primary"
            onClick={() => setEgresoModalOpen(true)}
          >
            <ArrowDownLeft size={18} />
            Registrar egreso
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-error" role="alert">
          <div>
            <strong>No se pudo cargar la caja</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => void loadMovimientos()}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="cash-metrics">
        <article className="cash-metric">
          <div className="cash-metric-icon cash-income">
            <ArrowDownLeft size={20} />
          </div>
          <span>Ingresos del período filtrado</span>
          <strong className="paid-amount">
            {formatMoney(resumen.ingresos)}
          </strong>
        </article>

        <article className="cash-metric">
          <div className="cash-metric-icon cash-expense">
            <ArrowUpRight size={20} />
          </div>
          <span>Egresos del período filtrado</span>
          <strong className="debt-amount">
            {formatMoney(resumen.egresos)}
          </strong>
        </article>

        <article className="cash-metric">
          <div className="cash-metric-icon cash-balance">
            <Wallet size={20} />
          </div>
          <span>Saldo neto del período filtrado</span>
          <strong
            className={
              resumen.ingresos - resumen.egresos < 0
                ? "debt-amount"
                : "cash-balance-value"
            }
          >
            {formatMoney(resumen.ingresos - resumen.egresos)}
          </strong>
        </article>
        
        <article className="cash-metric">
          <div className="cash-metric-icon cash-balance">
            <Wallet size={20} />
          </div>
          <span>Efectivo físico actual</span>
          <strong
            className={
              efectivoActual < 0 ? "debt-amount" : "cash-balance-value"
            }
          >
            {formatMoney(efectivoActual)}
          </strong>
          
        </article>
      </div>

      <section className="panel cash-filters">
        <div className="cash-filters-heading">
          <div>
            <h3>Movimientos</h3>
            <p>
              {movimientosFiltrados.length}{" "}
              {movimientosFiltrados.length === 1
                ? "movimiento"
                : "movimientos"}
            </p>
          </div>

          <button
            type="button"
            className="icon-button"
            title="Actualizar movimientos"
            aria-label="Actualizar movimientos"
            disabled={loading}
            onClick={() => void loadMovimientos()}
          >
            <RefreshCw size={17} />
          </button>
        </div>

        <div className="cash-filter-grid">
          <label className="cash-search">
            <Search size={17} />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar concepto, cliente..."
              aria-label="Buscar movimientos"
            />
          </label>

          <label className="cash-filter-field">
            <span>Tipo</span>
            <select
              value={filtroTipo}
              onChange={(event) =>
                setFiltroTipo(event.target.value as FiltroTipo)
              }
            >
              <option value="TODOS">Todos los movimientos</option>
              <option value="INGRESO">Ingresos</option>
              <option value="EGRESO">Egresos</option>
            </select>
          </label>

          <label className="cash-filter-field">
            <span>Medio de pago</span>
            <select
              value={filtroMedio}
              onChange={(event) =>
                setFiltroMedio(event.target.value as FiltroMedio)
              }
            >
              <option value="TODOS">Todos los medios</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta</option>
            </select>
          </label>

          <label className="cash-filter-field">
            <span>Desde</span>
            <span className="cash-date-input">
              <CalendarDays size={15} />
              <input
                type="date"
                value={fechaDesde}
                max={fechaHasta || undefined}
                onChange={(event) => setFechaDesde(event.target.value)}
              />
            </span>
          </label>

          <label className="cash-filter-field">
            <span>Hasta</span>
            <span className="cash-date-input">
              <CalendarDays size={15} />
              <input
                type="date"
                value={fechaHasta}
                min={fechaDesde || undefined}
                onChange={(event) => setFechaHasta(event.target.value)}
              />
            </span>
          </label>

          <button
            type="button"
            className="button button-secondary cash-clear-filters"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <section className="panel cash-table-panel">
        {loading && movimientos.length === 0 ? (
          <div className="loading-state">
            <span>Cargando movimientos...</span>
          </div>
        ) : movimientosFiltrados.length === 0 ? (
          <div className="clients-empty">
            <div className="clients-empty-icon">
              {error ? (
                <CircleAlert size={25} />
              ) : (
                <Wallet size={25} />
              )}
            </div>

            <h3>
              {error
                ? "No pudimos mostrar los movimientos"
                : movimientos.length === 0
                  ? "Todavía no hay movimientos"
                  : "No hay resultados para estos filtros"}
            </h3>

            <p>
              {error
                ? "Comprobá la conexión con el backend e intentá nuevamente."
                : movimientos.length === 0
                  ? "Los cobros registrados y los gastos que agregues aparecerán acá."
                  : "Probá cambiar los filtros o limpiar la búsqueda."}
            </p>

            {movimientos.length > 0 && (
              <button
                type="button"
                className="button button-secondary"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            )}

            {error && (
              <button
                type="button"
                className="button button-primary"
                onClick={() => void loadMovimientos()}
              >
                Reintentar
              </button>
            )}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table cash-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Tipo</th>
                  <th>Medio de pago</th>
                  <th>Observaciones</th>
                  <th className="cash-amount-heading">Importe</th>
                </tr>
              </thead>

              <tbody>
                {movimientosFiltrados.map((movimiento) => (
                  <tr key={movimiento.id}>
                    <td className="cash-date-cell">
                      {formatDate(movimiento.fecha)}
                    </td>

                    <td>
                      <div className="cash-concept">
                        <strong>{movimiento.concepto}</strong>

                        {movimiento.pago?.trabajo?.cliente?.nombre && (
                          <span>
                            Cliente: {movimiento.pago.trabajo.cliente.nombre}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          movimiento.tipo === "INGRESO"
                            ? "status-paid"
                            : "status-expense"
                        }`}
                      >
                        {movimiento.tipo === "INGRESO"
                          ? "Ingreso"
                          : "Egreso"}
                      </span>
                    </td>

                    <td>{medioPagoLabel[movimiento.medioPago]}</td>

                    <td>
                      <span
                        className="cash-observations"
                        title={movimiento.observaciones ?? ""}
                      >
                        {movimiento.observaciones || "—"}
                      </span>
                    </td>

                    <td className="cash-amount-cell">
                      <strong
                        className={
                          movimiento.tipo === "INGRESO"
                            ? "paid-amount"
                            : "debt-amount"
                        }
                      >
                        {movimiento.tipo === "INGRESO" ? "+" : "−"}
                        {formatMoney(movimiento.monto)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && movimientosFiltrados.length > 0 && (
          <footer className="cash-table-footer">
            Mostrando {movimientosFiltrados.length} de {movimientos.length}{" "}
            movimientos
          </footer>
        )}
      </section>

      {egresoModalOpen && (
        <EgresoFormModal
          onClose={() => setEgresoModalOpen(false)}
          onSaved={handleEgresoSaved}
        />
      )}
      
    {ingresoModalOpen && (
      <IngresoFormModal
        onClose={() => setIngresoModalOpen(false)}
        onSaved={handleIngresoSaved}
      />
    )}
    </section>
  );
}

export default CajaPage;
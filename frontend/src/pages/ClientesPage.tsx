import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  FilePlus2,
  PawPrint,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import ClienteFormModal from "../components/clientes/ClienteFormModal";
import { api } from "../services/api";
import type { Cliente } from "../types/cliente";

function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);

  async function loadClientes() {
    setLoading(true);
    setError(null);

    try {
      const data = await api.get<Cliente[]>("/clientes");
      setClientes(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los clientes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClientes();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-AR");

    if (!term) return clientes;

    return clientes.filter((cliente) => {
      const nombre = cliente.nombre.toLocaleLowerCase("es-AR");
      const telefono = cliente.telefono?.toLocaleLowerCase("es-AR") ?? "";
      const direccion = cliente.direccion?.toLocaleLowerCase("es-AR") ?? "";

      return (
        nombre.includes(term) ||
        telefono.includes(term) ||
        direccion.includes(term)
      );
    });
  }, [clientes, search]);

  function openCreateModal() {
    setClienteSeleccionado(null);
    setModalOpen(true);
  }

  function openEditModal(cliente: Cliente) {
    setClienteSeleccionado(cliente);
    setModalOpen(true);
  }

  async function handleSaved() {
    setModalOpen(false);
    setClienteSeleccionado(null);
    await loadClientes();
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">Gestión</span>
          <h2>Clientes</h2>
          <p>
            Administrá los clientes y sus cuentas corrientes.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Nuevo cliente
        </button>
      </div>

      <section className="client-toolbar panel">
        <div className="client-search">
          <Search size={18} />
          <input
            type="search"
            aria-label="Buscar clientes"
            placeholder="Buscar por nombre, teléfono o dirección..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="client-count">
          <Users size={17} />
          <span>
            {clientesFiltrados.length}{" "}
            {clientesFiltrados.length === 1 ? "cliente" : "clientes"}
          </span>
        </div>
      </section>

      {error && (
        <div className="alert-error" role="alert">
          <div>
            <strong>No se pudieron cargar los clientes</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => void loadClientes()}
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="panel clients-panel">
        {loading ? (
          <div className="loading-state">
            <span>Cargando clientes...</span>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="clients-empty">
            <div className="clients-empty-icon">
              {search ? <Search size={25} /> : <PawPrint size={25} />}
            </div>

            <h3>
              {search
                ? "No encontramos coincidencias"
                : "Todavía no hay clientes"}
            </h3>

            <p>
              {search
                ? "Probá con otro nombre, teléfono o dirección."
                : "Cuando registres tu primer cliente, aparecerá en esta lista."}
            </p>

            {!search && (
              <button
                type="button"
                className="button button-primary"
                onClick={openCreateModal}
              >
                <FilePlus2 size={17} />
                Registrar primer cliente
              </button>
            )}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Observaciones</th>
                  <th className="table-actions-heading">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <div className="client-name-cell">
                        <div className="client-avatar">
                          {cliente.nombre.trim().charAt(0).toLocaleUpperCase("es-AR")}
                        </div>

                        <div>
                          <strong>{cliente.nombre}</strong>
                          <span>Cliente #{cliente.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>{cliente.telefono || "—"}</td>
                    <td>{cliente.direccion || "—"}</td>

                    <td>
                      <span
                        className="client-observations"
                        title={cliente.observaciones ?? ""}
                      >
                        {cliente.observaciones || "—"}
                      </span>
                    </td>

                    <td>
                      <div className="client-row-actions">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Editar ${cliente.nombre}`}
                          title="Editar cliente"
                          onClick={() => openEditModal(cliente)}
                        >
                          <Pencil size={16} />
                        </button>

                        <Link
                          className="icon-button"
                          to={`/clientes/${cliente.id}`}
                          aria-label={`Ver detalle de ${cliente.nombre}`}
                          title="Ver detalle"
                        >
                          <ArrowUpRight size={17} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <ClienteFormModal
          cliente={clienteSeleccionado}
          onClose={() => {
            setModalOpen(false);
            setClienteSeleccionado(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}

export default ClientesPage;
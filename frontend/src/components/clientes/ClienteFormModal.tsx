import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { api } from "../../services/api";
import type { Cliente, ClienteFormData } from "../../types/cliente";
import { useToast } from "../ui/ToastProvider";

interface ClienteFormModalProps {
  cliente?: Cliente | null;
  onClose: () => void;
  onSaved: () => void;
}

const initialForm: ClienteFormData = {
  nombre: "",
  telefono: "",
  direccion: "",
  observaciones: "",
};

function ClienteFormModal({
  cliente,
  onClose,
  onSaved,
}: ClienteFormModalProps) {
  const [form, setForm] = useState<ClienteFormData>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const isEditing = Boolean(cliente);

  useEffect(() => {
    if (!cliente) {
      setForm(initialForm);
      return;
    }

    setForm({
      nombre: cliente.nombre,
      telefono: cliente.telefono ?? "",
      direccion: cliente.direccion ?? "",
      observaciones: cliente.observaciones ?? "",
    });
  }, [cliente]);

  function handleChange(field: keyof ClienteFormData, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      direccion: form.direccion.trim() || null,
      observaciones: form.observaciones.trim() || null,
    };

    if (!payload.nombre) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }

    setSaving(true);

    try {
      if (cliente) {
        await api.put<Cliente>(`/clientes/${cliente.id}`, payload);
        showToast("Cliente actualizado correctamente.", "success");
      } else {
        await api.post<Cliente>("/clientes", payload);
        showToast("Cliente registrado correctamente.", "success");
      }

      onSaved();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo guardar el cliente.";

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
        aria-labelledby="cliente-form-title"
      >
        <header className="modal-header">
          <div>
            <span className="page-eyebrow">Gestión de clientes</span>
            <h3 id="cliente-form-title">
              {isEditing ? "Editar cliente" : "Nuevo cliente"}
            </h3>
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
              <span>Nombre completo *</span>
              <input
                autoFocus
                required
                maxLength={120}
                value={form.nombre}
                onChange={(event) =>
                  handleChange("nombre", event.target.value)
                }
                placeholder="Ej. Juan Pérez"
              />
            </label>

            <label className="form-field">
              <span>Teléfono</span>
              <input
                type="tel"
                maxLength={40}
                value={form.telefono}
                onChange={(event) =>
                  handleChange("telefono", event.target.value)
                }
                placeholder="Ej. 3456 123456"
              />
            </label>

            <label className="form-field">
              <span>Dirección</span>
              <input
                maxLength={200}
                value={form.direccion}
                onChange={(event) =>
                  handleChange("direccion", event.target.value)
                }
                placeholder="Dirección del cliente"
              />
            </label>

            <label className="form-field">
              <span>Observaciones</span>
              <textarea
                rows={3}
                maxLength={1000}
                value={form.observaciones}
                onChange={(event) =>
                  handleChange("observaciones", event.target.value)
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
              {saving
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Crear cliente"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default ClienteFormModal;


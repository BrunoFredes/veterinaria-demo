import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, Check, Clock, DatabaseBackup, Download, HardDrive,
  LoaderCircle, Monitor, Moon, RefreshCw, ShieldCheck, Sun, Type,
} from "lucide-react";
import { api } from "../services/api";
import {
  aplicarEscalaVisual, aplicarTemaVisual, obtenerEscalaVisual, obtenerTemaVisual,
  type EscalaVisual, type TemaVisual,
} from "../utils/preferencias";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/ToastProvider";

type TipoBackup = "automatic" | "manual" | "preRestore";
type TipoAccionBackup = "crear" | "automatic" | "manual";

interface BackupInfo {
  type: TipoBackup;
  filename: string;
  path: string;
  exists: boolean;
  sizeBytes: number;
  createdAt: string | null;
}
interface BackupsDisponibles {
  automatic: BackupInfo;
  manual: BackupInfo;
  preRestore: BackupInfo;
}

const opcionesEscala: {
  valor: EscalaVisual;
  titulo: string;
  descripcion: string;
}[] = [
  { valor: "90", titulo: "Pequeño", descripcion: "Más contenido visible en pantalla" },
  { valor: "100", titulo: "Normal", descripcion: "Tamaño predeterminado" },
  { valor: "110", titulo: "Grande", descripcion: "Interfaz más cómoda de leer" },
];

function formatearFecha(fecha: string | null): string {
  if (!fecha) return "Fecha no disponible";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatearPeso(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "Tamaño desconocido";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function obtenerMensajeError(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function ConfiguracionPage() {
  const [escala, setEscala] = useState<EscalaVisual>(obtenerEscalaVisual);
  const [tema, setTema] = useState<TemaVisual>(obtenerTemaVisual);
  const { showToast } = useToast();
  const [confirmacion, setConfirmacion] = useState<TipoAccionBackup | null>(null);
  const [backups, setBackups] = useState<BackupsDisponibles | null>(null);
  const [cargandoBackups, setCargandoBackups] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [accion, setAccion] = useState<TipoAccionBackup | null>(null);
  const [errorBackup, setErrorBackup] = useState<string | null>(null);

  const cargarBackups = useCallback(async () => {
    setActualizando(true);
    setErrorBackup(null);
    try {
      const datos = await api.get<BackupsDisponibles>("/backup");
      setBackups(datos);
    } catch (error) {
      setErrorBackup(obtenerMensajeError(error));
    } finally {
      setCargandoBackups(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    void cargarBackups();
  }, [cargarBackups]);

  function cambiarEscala(nuevaEscala: EscalaVisual) {
    aplicarEscalaVisual(nuevaEscala);
    setEscala(nuevaEscala);
  }

  function cambiarTema(nuevoTema: TemaVisual) {
    aplicarTemaVisual(nuevoTema);
    setTema(nuevoTema);
  }

  async function crearBackupManual() {
    setAccion("crear");
    try {
      await api.post("/backup", {});
      showToast("Copia de seguridad creada correctamente.", "success");
      await cargarBackups();
    } catch (error) {
      showToast(`No se pudo crear la copia: ${obtenerMensajeError(error)}`, "error");
    } finally {
      setAccion(null);
    }
  }

  async function restaurarBackup(tipo: "automatic" | "manual") {
    if (!backups?.[tipo]?.exists) {
      showToast("La copia seleccionada no está disponible.", "error");
      return;
    }
    setAccion(tipo);
    try {
      await api.post("/backup/restore", { type: tipo });
      showToast(
        "Restauración solicitada. El backend se cerrará; reiniciá el sistema antes de volver a utilizarlo.",
        "info",
      );
    } catch (error) {
      showToast(
        `No se pudo confirmar la respuesta del servidor: ${obtenerMensajeError(error)}. Verificá el estado de la base de datos antes de reintentar.`,
        "error",
      );
    } finally {
      setAccion(null);
    }
  }

  async function confirmarAccion() {
    const elegida = confirmacion;
    if (!elegida || accion !== null) return;
    if (elegida === "crear") await crearBackupManual();
    else await restaurarBackup(elegida);
    setConfirmacion(null);
  }

  function renderBackupCard(
    tipo: "automatic" | "manual",
    titulo: string,
    descripcion: string,
  ) {
    const backup = backups?.[tipo];
    const restaurando = accion === tipo;
    return (
      <article className="backup-card" key={tipo}>
        <div className="backup-card-heading">
          <div className="settings-card-icon">
            {tipo === "automatic" ? <Clock size={19} /> : <HardDrive size={19} />}
          </div>
          <div className="backup-card-copy">
            <h4>{titulo}</h4>
            <p>{descripcion}</p>
          </div>
          <span className={`backup-status ${backup?.exists ? "backup-status-ready" : "backup-status-missing"}`}>
            {backup?.exists ? "Disponible" : "No disponible"}
          </span>
        </div>

        {cargandoBackups ? (
          <p className="backup-metadata">Consultando estado...</p>
        ) : backup?.exists ? (
          <div className="backup-metadata">
            <span><strong>Archivo:</strong> {backup.filename}</span>
            <span><strong>Tamaño:</strong> {formatearPeso(backup.sizeBytes)}</span>
            <span><strong>Fecha:</strong> {formatearFecha(backup.createdAt)}</span>
          </div>
        ) : (
          <p className="backup-metadata">Todavía no hay una copia disponible de este tipo.</p>
        )}

        <div className="backup-card-actions">
          {tipo === "manual" && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => setConfirmacion("crear")}
              disabled={accion !== null || cargandoBackups}
            >
              {accion === "crear" ? <LoaderCircle size={16} className="backup-spinner" /> : <DatabaseBackup size={16} />}
              Crear copia manual
            </button>
          )}
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setConfirmacion(tipo)}
            disabled={!backup?.exists || accion !== null || cargandoBackups}
          >
            {restaurando ? <LoaderCircle size={16} className="backup-spinner" /> : <RefreshCw size={16} />}
            Restaurar copia
          </button>
        </div>
      </article>
    );
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">Sistema</span>
          <h2>Configuración</h2>
          <p>Personalizá la apariencia y administrá el sistema.</p>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-heading">
          <div className="settings-section-icon"><Monitor size={21} /></div>
          <div><h3>Apariencia</h3><p>Adaptá la interfaz a tus preferencias.</p></div>
        </div>
        <div className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-card-icon"><Type size={19} /></div>
            <div>
              <h4>Tamaño del texto y la interfaz</h4>
              <p>La preferencia se guarda automáticamente en este equipo.</p>
            </div>
          </div>
        <div className="settings-card settings-theme-card">
          <div className="settings-card-heading">
            <div className="settings-card-icon">{tema === "oscuro" ? <Moon size={19} /> : <Sun size={19} />}</div>
            <div>
              <h4>Tema de la aplicación</h4>
              <p>Elegí una apariencia clara u oscura. La preferencia se guarda en este equipo.</p>
            </div>
          </div>
          <div className="settings-theme-options" role="group" aria-label="Tema de la aplicación">
            <button
              type="button"
              className={`settings-theme-option ${tema === "claro" ? "selected" : ""}`}
              aria-pressed={tema === "claro"}
              onClick={() => cambiarTema("claro")}
            >
              <Sun size={18} />
              <span><strong>Claro</strong><small>Interfaz luminosa</small></span>
              {tema === "claro" && <Check size={18} className="settings-scale-check" />}
            </button>
            <button
              type="button"
              className={`settings-theme-option ${tema === "oscuro" ? "selected" : ""}`}
              aria-pressed={tema === "oscuro"}
              onClick={() => cambiarTema("oscuro")}
            >
              <Moon size={18} />
              <span><strong>Oscuro</strong><small>Menos brillo en pantalla</small></span>
              {tema === "oscuro" && <Check size={18} className="settings-scale-check" />}
            </button>
          </div>
        </div>

          <div className="settings-scale-options" role="group" aria-label="Tamaño del texto y la interfaz">
            {opcionesEscala.map((opcion) => {
              const seleccionada = escala === opcion.valor;
              return (
                <button
                  key={opcion.valor}
                  type="button"
                  className={`settings-scale-option ${seleccionada ? "selected" : ""}`}
                  aria-pressed={seleccionada}
                  onClick={() => cambiarEscala(opcion.valor)}
                >
                  <span className="settings-scale-preview">
                    <span style={{ fontSize: `${Number(opcion.valor) / 100}em` }}>Aa</span>
                  </span>
                  <span className="settings-scale-copy">
                    <strong>{opcion.titulo}</strong>
                    <small>{opcion.descripcion}</small>
                  </span>
                  {seleccionada && <Check className="settings-scale-check" size={18} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-heading">
          <div className="settings-section-icon"><ShieldCheck size={21} /></div>
          <div>
            <h3>Copias de seguridad</h3>
            <p>Protegé los datos de clientes, trabajos, pagos y movimientos de caja.</p>
          </div>
        </div>

        <div className="settings-card backup-intro">
          <div className="backup-intro-icon"><ShieldCheck size={22} /></div>
          <div>
            <h4>Protección de los datos</h4>
            <p>
              Podés crear una copia manual antes de cambios importantes.
              Restaurar una copia reemplaza los datos actuales por los que contenía esa copia.
            </p>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void cargarBackups()}
            disabled={actualizando || accion !== null}
          >
            {actualizando ? <LoaderCircle size={16} className="backup-spinner" /> : <RefreshCw size={16} />}
            Actualizar
          </button>
        </div>

        {errorBackup && (
          <div className="backup-feedback backup-feedback-error" role="alert">
            <AlertTriangle size={18} />
            <span>{errorBackup}</span>
          </div>
        )}

        <div className="backup-grid">
          {renderBackupCard("automatic", "Copia automática", "Respaldo generado por el sistema según su programación.")}
          {renderBackupCard("manual", "Copia manual", "Creá un respaldo cuando lo necesites.")}
        </div>

        <div className="settings-card backup-restore-safety">
          <div className="settings-card-icon"><Download size={19} /></div>
          <div>
            <h4>Copia previa a la restauración</h4>
            <p>
              Si existe, este archivo contiene la base de datos que había antes de la última
              restauración. Se conserva como medida de seguridad.
            </p>
            {cargandoBackups ? (
              <span className="backup-metadata">Consultando estado...</span>
            ) : backups?.preRestore.exists ? (
              <div className="backup-metadata">
                <span><strong>Archivo:</strong> {backups.preRestore.filename}</span>
                <span><strong>Tamaño:</strong> {formatearPeso(backups.preRestore.sizeBytes)}</span>
                <span><strong>Fecha:</strong> {formatearFecha(backups.preRestore.createdAt)}</span>
              </div>
            ) : (
              <span className="backup-metadata">Todavía no se generó una copia previa.</span>
            )}
          </div>
        </div>

        <p className="backup-warning">
          <AlertTriangle size={16} />
          Las copias se guardan en el equipo donde se ejecuta el sistema. Si el disco falla,
          una copia guardada únicamente en ese disco también podría perderse. Para mayor
          protección, guardá periódicamente otra copia en un dispositivo externo.
        </p>
      </div>

      <ConfirmDialog
        open={confirmacion !== null}
        title={confirmacion === "crear" ? "Crear copia de seguridad" : "¿Restaurar esta copia?"}
        description={
          confirmacion === "crear"
            ? "Se generará una nueva copia manual de la base de datos actual."
            : `Los datos actuales serán reemplazados por los datos de la copia ${
                confirmacion === "automatic" ? "automática" : "manual"
              } seleccionada.`
        }
        details={
          confirmacion === "crear"
            ? "La copia manual anterior será reemplazada por la nueva."
            : "Antes de restaurar se guardará una copia previa. El backend se cerrará y tendrás que reiniciarlo para continuar."
        }
        variant={confirmacion === "crear" ? "default" : "danger"}
        confirmLabel={confirmacion === "crear" ? "Crear copia" : "Sí, restaurar"}
        cancelLabel="Cancelar"
        loading={accion !== null}
        onCancel={() => {
          if (accion === null) setConfirmacion(null);
        }}
        onConfirm={() => void confirmarAccion()}
      />
    </section>
  );
}

export default ConfiguracionPage;

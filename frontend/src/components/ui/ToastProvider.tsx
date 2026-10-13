
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++nextId.current;

      setToasts((current) => [
        ...current.slice(-3),
        { id, message, type },
      ]);

      const timer = setTimeout(() => dismissToast(id), 4000);
      timers.current.set(id, timer);
    },
    [dismissToast],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="toast-container" aria-label="Notificaciones">
        {toasts.map((toast) => {
          const Icon =
            toast.type === "success"
              ? CheckCircle2
              : toast.type === "error"
                ? AlertCircle
                : Info;

          return (
            <div
              key={toast.id}
              className={`toast toast-${toast.type}`}
              role={toast.type === "error" ? "alert" : "status"}
            >
              <Icon size={20} className="toast-icon" />
              <span>{toast.message}</span>
              <button
                type="button"
                className="toast-dismiss"
                aria-label="Cerrar notificación"
                onClick={() => dismissToast(toast.id)}
              >
                <X size={17} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe utilizarse dentro de ToastProvider");
  }

  return context;
}
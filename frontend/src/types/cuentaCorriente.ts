import type { Cliente } from "./cliente";

export interface Pago {
  id: number;
  trabajoId: number;
  fecha: string;
  monto: number;
  medioPago: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA";
  observaciones: string | null;
  createdAt: string;
}

export interface Trabajo {
  id: number;
  fecha: string;
  descripcion: string;
  total: number;
  pagado: number;
  deuda: number;
  estado: "PENDIENTE" | "PAGO_PARCIAL" | "PAGADO";
  pagos: Pago[];
}

export interface ClienteResumenDatos {
  totalFacturado: number;
  totalPagado: number;
  deuda: number;
  estado: "AL_DIA" | "DEUDOR";
}

export interface ClienteResumen {
  cliente: Cliente;
  resumen: ClienteResumenDatos;
  trabajos: Trabajo[];
}
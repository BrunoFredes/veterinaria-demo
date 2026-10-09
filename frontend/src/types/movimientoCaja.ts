
export type TipoMovimiento = "INGRESO" | "EGRESO";

export type MedioPago =
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "TARJETA";

export interface MovimientoCaja {
  id: number;
  fecha: string;
  tipo: TipoMovimiento;
  concepto: string;
  monto: number;
  medioPago: MedioPago;
  observaciones: string | null;
  createdAt: string;
  pagoId?: number | null;
  pago?: {
    id: number;
    trabajo?: {
      descripcion: string;
      cliente?: {
        nombre: string;
      };
    };
  } | null;
}

export interface MovimientoCajaFormData {
  concepto: string;
  monto: number;
  medioPago: MedioPago;
  fecha?: string;
  observaciones?: string | null;
}
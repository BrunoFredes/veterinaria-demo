export interface DashboardData {
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
  };
}

export interface Movimiento {
  id: number;
  fecha: string;
  tipo: "INGRESO" | "EGRESO";
  concepto: string;
  monto: number;
  medioPago: string;
}
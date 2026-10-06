import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/dashboard
router.get("/", async (_req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        trabajos: {
          include: {
            pagos: true,
          },
        },
      },
    });

    const movimientos = await prisma.movimientoCaja.findMany();

    let totalFacturado = 0;
    let totalPagado = 0;
    let totalDeuda = 0;

    let clientesAlDia = 0;
    let clientesDeudores = 0;

    for (const cliente of clientes) {
      let deudaCliente = 0;

      for (const trabajo of cliente.trabajos) {
        const pagado = trabajo.pagos.reduce(
          (total, pago) => total + pago.monto,
          0,
        );

        totalFacturado += trabajo.total;
        totalPagado += pagado;

        const deudaTrabajo = Math.max(
          trabajo.total - pagado,
          0,
        );

        deudaCliente += deudaTrabajo;
      }

      totalDeuda += deudaCliente;

      if (deudaCliente > 0) {
        clientesDeudores++;
      } else {
        clientesAlDia++;
      }
    }

    const ingresos = movimientos.filter(
      (movimiento) => movimiento.tipo === "INGRESO",
    );

    const egresos = movimientos.filter(
      (movimiento) => movimiento.tipo === "EGRESO",
    );

    const totalIngresos = ingresos.reduce(
      (total, movimiento) => total + movimiento.monto,
      0,
    );

    const totalEgresos = egresos.reduce(
      (total, movimiento) => total + movimiento.monto,
      0,
    );

    const saldoCaja = totalIngresos - totalEgresos;

    const calcularPorMedio = (
      movimientos: typeof ingresos,
    ) => ({
      efectivo: movimientos
        .filter((movimiento) => movimiento.medioPago === "EFECTIVO")
        .reduce((total, movimiento) => total + movimiento.monto, 0),

      transferencia: movimientos
        .filter(
          (movimiento) => movimiento.medioPago === "TRANSFERENCIA",
        )
        .reduce((total, movimiento) => total + movimiento.monto, 0),

      tarjeta: movimientos
        .filter((movimiento) => movimiento.medioPago === "TARJETA")
        .reduce((total, movimiento) => total + movimiento.monto, 0),
    });

    res.json({
      clientes: {
        total: clientes.length,
        alDia: clientesAlDia,
        deudores: clientesDeudores,
      },

      trabajos: {
        totalFacturado,
        totalPagado,
        totalDeuda,
      },

      caja: {
        totalIngresos,
        totalEgresos,
        saldo: saldoCaja,

        ingresosPorMedio: calcularPorMedio(ingresos),
        egresosPorMedio: calcularPorMedio(egresos),
      },
    });
  } catch (error) {
    console.error("Error al obtener dashboard:", error);

    res.status(500).json({
      message: "Error al obtener los datos del dashboard",
    });
  }
});

export default router;
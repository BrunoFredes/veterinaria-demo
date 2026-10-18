
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const periodo = req.query.periodo === "hoy" ? "hoy" : "mes";

    const ahora = new Date();
    const inicioPeriodo = new Date(ahora);

    if (periodo === "hoy") {
      inicioPeriodo.setHours(0, 0, 0, 0);
    } else {
      inicioPeriodo.setDate(1);
      inicioPeriodo.setHours(0, 0, 0, 0);
    }

    const clientes = await prisma.cliente.findMany({
      include: {
        trabajos: {
          include: { pagos: true },
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
        deudaCliente += Math.max(trabajo.total - pagado, 0);
      }

      totalDeuda += deudaCliente;

      if (deudaCliente > 0) {
        clientesDeudores++;
      } else {
        clientesAlDia++;
      }
    }

    const movimientosPeriodo = movimientos.filter((movimiento) => {
      const fecha = new Date(movimiento.fecha);
      return fecha >= inicioPeriodo && fecha <= ahora;
    });

    const ingresosPeriodo = movimientosPeriodo.filter(
      (movimiento) => movimiento.tipo === "INGRESO",
    );

    const egresosPeriodo = movimientosPeriodo.filter(
      (movimiento) => movimiento.tipo === "EGRESO",
    );

    const ingresosHistoricos = movimientos.filter(
      (movimiento) => movimiento.tipo === "INGRESO",
    );

    const egresosHistoricos = movimientos.filter(
      (movimiento) => movimiento.tipo === "EGRESO",
    );

    const sumar = (
      lista: typeof movimientos,
    ) => lista.reduce((total, movimiento) => total + movimiento.monto, 0);

    const calcularPorMedio = (
      lista: typeof movimientos,
    ) => ({
      efectivo: sumar(
        lista.filter((movimiento) => movimiento.medioPago === "EFECTIVO"),
      ),
      transferencia: sumar(
        lista.filter((movimiento) => movimiento.medioPago === "TRANSFERENCIA"),
      ),
      tarjeta: sumar(
        lista.filter((movimiento) => movimiento.medioPago === "TARJETA"),
      ),
    });

    const efectivoActual = movimientos
      .filter((movimiento) => movimiento.medioPago === "EFECTIVO")
      .reduce(
        (total, movimiento) =>
          total +
          (movimiento.tipo === "INGRESO"
            ? movimiento.monto
            : -movimiento.monto),
        0,
      );

    res.json({
      periodo,
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
        totalIngresos: sumar(ingresosPeriodo),
        totalEgresos: sumar(egresosPeriodo),

        // Saldo contable acumulado, independiente del período.
        saldo: sumar(ingresosHistoricos) - sumar(egresosHistoricos),

        // Efectivo físico actual, independiente del período.
        efectivoActual,

        ingresosPorMedio: calcularPorMedio(ingresosPeriodo),
        egresosPorMedio: calcularPorMedio(egresosPeriodo),
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
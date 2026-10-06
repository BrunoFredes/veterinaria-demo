import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

const MEDIOS_PAGO_VALIDOS = [
  "EFECTIVO",
  "TRANSFERENCIA",
  "TARJETA",
];

// GET /api/pagos
router.get("/", async (_req, res) => {
  try {
    const pagos = await prisma.pago.findMany({
      orderBy: {
        fecha: "desc",
      },
      include: {
        trabajo: {
          include: {
            cliente: true,
          },
        },
        movimiento: true,
      },
    });

    res.json(pagos);
  } catch (error) {
    console.error("Error al obtener pagos:", error);

    res.status(500).json({
      message: "Error al obtener los pagos",
    });
  }
});

// POST /api/pagos
router.post("/", async (req, res) => {
  try {
    const {
      trabajoId,
      monto,
      medioPago,
      fecha,
      observaciones,
    } = req.body;

    if (!trabajoId || !Number.isInteger(Number(trabajoId))) {
      return res.status(400).json({
        message: "El trabajo es obligatorio",
      });
    }

    if (
      monto === undefined ||
      monto === null ||
      !Number.isInteger(Number(monto)) ||
      Number(monto) <= 0
    ) {
      return res.status(400).json({
        message: "El monto debe ser un número entero mayor a 0",
      });
    }

    if (!MEDIOS_PAGO_VALIDOS.includes(medioPago)) {
      return res.status(400).json({
        message: "Medio de pago inválido",
      });
    }

    const trabajo = await prisma.trabajo.findUnique({
      where: {
        id: Number(trabajoId),
      },
      include: {
        pagos: true,
        cliente: true,
      },
    });

    if (!trabajo) {
      return res.status(404).json({
        message: "Trabajo no encontrado",
      });
    }

    const totalPagado = trabajo.pagos.reduce(
      (total, pago) => total + pago.monto,
      0,
    );

    const saldoPendiente = trabajo.total - totalPagado;
    const montoPago = Number(monto);

    if (montoPago > saldoPendiente) {
      return res.status(400).json({
        message: "El pago supera el saldo pendiente",
        saldoPendiente,
      });
    }

    let fechaPago: Date | undefined;

    if (fecha) {
      const fechaParseada = new Date(fecha);

      if (Number.isNaN(fechaParseada.getTime())) {
        return res.status(400).json({
          message: "La fecha es inválida",
        });
      }

      fechaPago = fechaParseada;
    }

    /*
     * Pago + movimiento de ingreso se crean dentro
     * de una misma transacción.
     *
     * Si una de las dos operaciones falla,
     * ninguna queda guardada.
     */
    const resultado = await prisma.$transaction(async (tx) => {
      const pago = await tx.pago.create({
        data: {
          trabajoId: Number(trabajoId),
          monto: montoPago,
          medioPago,
          observaciones: observaciones?.trim() || null,
          ...(fechaPago
            ? {
                fecha: fechaPago,
              }
            : {}),
        },
      });

      const movimiento = await tx.movimientoCaja.create({
        data: {
          fecha: fechaPago ?? new Date(),
          tipo: "INGRESO",
          concepto: `Pago de ${trabajo.cliente.nombre} - ${trabajo.descripcion}`,
          monto: montoPago,
          medioPago,
          observaciones: observaciones?.trim() || null,
          pagoId: pago.id,
        },
      });

      return {
        pago,
        movimiento,
      };
    });

    res.status(201).json(resultado);
  } catch (error) {
    console.error("Error al registrar pago:", error);

    res.status(500).json({
      message: "Error al registrar el pago",
    });
  }
});

export default router;
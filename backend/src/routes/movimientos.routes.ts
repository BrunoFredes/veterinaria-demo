import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

const MEDIOS_PAGO_VALIDOS = [
  "EFECTIVO",
  "TRANSFERENCIA",
  "TARJETA",
];

// GET /api/movimientos
router.get("/", async (_req, res) => {
  try {
    const movimientos = await prisma.movimientoCaja.findMany({
      orderBy: {
        fecha: "desc",
      },
      include: {
        pago: {
          include: {
            trabajo: {
              include: {
                cliente: true,
              },
            },
          },
        },
      },
    });

    res.json(movimientos);
  } catch (error) {
    console.error("Error al obtener movimientos:", error);

    res.status(500).json({
      message: "Error al obtener los movimientos",
    });
  }
});

// POST /api/movimientos
// Se utiliza principalmente para EGRESOS.
router.post("/", async (req, res) => {
  try {
    const {
      tipo,
      concepto,
      monto,
      medioPago,
      fecha,
      observaciones,
    } = req.body;

    if (tipo !== "EGRESO") {
      return res.status(400).json({
        message:
          "Los ingresos deben registrarse mediante el endpoint de pagos",
      });
    }

    if (
      !concepto ||
      typeof concepto !== "string" ||
      !concepto.trim()
    ) {
      return res.status(400).json({
        message: "El concepto es obligatorio",
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

    let fechaMovimiento: Date | undefined;

    if (fecha) {
      const fechaParseada = new Date(fecha);

      if (Number.isNaN(fechaParseada.getTime())) {
        return res.status(400).json({
          message: "La fecha es inválida",
        });
      }

      fechaMovimiento = fechaParseada;
    }

    const movimiento = await prisma.movimientoCaja.create({
      data: {
        tipo: "EGRESO",
        concepto: concepto.trim(),
        monto: Number(monto),
        medioPago,
        observaciones: observaciones?.trim() || null,
        ...(fechaMovimiento
          ? {
              fecha: fechaMovimiento,
            }
          : {}),
      },
    });

    res.status(201).json(movimiento);
  } catch (error) {
    console.error("Error al registrar egreso:", error);

    res.status(500).json({
      message: "Error al registrar el egreso",
    });
  }
});

export default router;
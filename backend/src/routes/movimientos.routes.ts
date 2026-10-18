
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

const MEDIOS_PAGO_VALIDOS = [
  "EFECTIVO",
  "TRANSFERENCIA",
  "TARJETA",
] as const;

// GET /api/movimientos
router.get("/", async (_req, res) => {
  try {
    const movimientos = await prisma.movimientoCaja.findMany({
      orderBy: { fecha: "desc" },
      include: {
        pago: {
          include: {
            trabajo: {
              include: { cliente: true },
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

// GET /api/movimientos/efectivo
// Devuelve el saldo físico calculado a partir de los movimientos.
router.get("/efectivo", async (_req, res) => {
  try {
    const movimientos = await prisma.movimientoCaja.findMany({
      where: { medioPago: "EFECTIVO" },
      select: { tipo: true, monto: true },
    });

    const saldo = movimientos.reduce(
      (total, movimiento) =>
        total +
        (movimiento.tipo === "INGRESO"
          ? movimiento.monto
          : -movimiento.monto),
      0,
    );

    res.json({ saldo });
  } catch (error) {
    console.error("Error al calcular el efectivo:", error);
    res.status(500).json({
      message: "Error al calcular el efectivo disponible",
    });
  }
});

// POST /api/movimientos
// Registra egresos y aportes externos de efectivo.
// Los cobros de clientes deben seguir usando /api/pagos.
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

    if (tipo !== "INGRESO" && tipo !== "EGRESO") {
      return res.status(400).json({
        message: "El tipo de movimiento es inválido",
      });
    }

    if (tipo === "INGRESO" && medioPago !== "EFECTIVO") {
      return res.status(400).json({
        message:
          "Los ingresos externos deben ser en efectivo. Los cobros de clientes se registran desde sus trabajos.",
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

    const montoNumerico = Number(monto);

    if (
      monto === undefined ||
      monto === null ||
      !Number.isSafeInteger(montoNumerico) ||
      montoNumerico <= 0
    ) {
      return res.status(400).json({
        message: "El monto debe ser un número entero mayor a 0",
      });
    }

    if (
      !MEDIOS_PAGO_VALIDOS.includes(
        medioPago as (typeof MEDIOS_PAGO_VALIDOS)[number],
      )
    ) {
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

    // Solo un egreso en efectivo puede reducir la caja física.
    if (tipo === "EGRESO" && medioPago === "EFECTIVO") {
      const movimientosEfectivo =
        await prisma.movimientoCaja.findMany({
          where: { medioPago: "EFECTIVO" },
          select: { tipo: true, monto: true },
        });

      const efectivoActual = movimientosEfectivo.reduce(
        (total, movimiento) =>
          total +
          (movimiento.tipo === "INGRESO"
            ? movimiento.monto
            : -movimiento.monto),
        0,
      );

      if (montoNumerico > efectivoActual) {
        return res.status(400).json({
          message: `Efectivo insuficiente. Hay ${new Intl.NumberFormat(
            "es-AR",
            {
              style: "currency",
              currency: "ARS",
              maximumFractionDigits: 0,
            },
          ).format(efectivoActual)} disponibles en la caja.`,
          efectivoDisponible: efectivoActual,
        });
      }
    }

    const movimiento = await prisma.movimientoCaja.create({
      data: {
        tipo,
        concepto: concepto.trim(),
        monto: montoNumerico,
        medioPago,
        observaciones:
          typeof observaciones === "string"
            ? observaciones.trim() || null
            : null,
        ...(fechaMovimiento ? { fecha: fechaMovimiento } : {}),
      },
    });

    res.status(201).json(movimiento);
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    res.status(500).json({
      message: "Error al registrar el movimiento",
    });
  }
});

export default router;
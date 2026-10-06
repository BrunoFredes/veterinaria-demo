import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/trabajos
router.get("/", async (_req, res) => {
  try {
    const trabajos = await prisma.trabajo.findMany({
      orderBy: {
        fecha: "desc",
      },
      include: {
        cliente: true,
        pagos: {
          orderBy: {
            fecha: "desc",
          },
        },
      },
    });

    res.json(trabajos);
  } catch (error) {
    console.error("Error al obtener trabajos:", error);

    res.status(500).json({
      message: "Error al obtener los trabajos",
    });
  }
});

// GET /api/trabajos/cliente/:clienteId
router.get("/cliente/:clienteId", async (req, res) => {
  try {
    const clienteId = Number(req.params.clienteId);

    if (!Number.isInteger(clienteId)) {
      return res.status(400).json({
        message: "ID de cliente inválido",
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: {
        id: clienteId,
      },
    });

    if (!cliente) {
      return res.status(404).json({
        message: "Cliente no encontrado",
      });
    }

    const trabajos = await prisma.trabajo.findMany({
      where: {
        clienteId,
      },
      orderBy: {
        fecha: "desc",
      },
      include: {
        pagos: {
          orderBy: {
            fecha: "desc",
          },
        },
      },
    });

    res.json(trabajos);
  } catch (error) {
    console.error("Error al obtener trabajos del cliente:", error);

    res.status(500).json({
      message: "Error al obtener los trabajos del cliente",
    });
  }
});

// POST /api/trabajos
router.post("/", async (req, res) => {
  try {
    const {
      clienteId,
      descripcion,
      total,
      fecha,
    } = req.body;

    if (!clienteId || !Number.isInteger(Number(clienteId))) {
      return res.status(400).json({
        message: "El cliente es obligatorio",
      });
    }

    if (
      !descripcion ||
      typeof descripcion !== "string" ||
      !descripcion.trim()
    ) {
      return res.status(400).json({
        message: "La descripción es obligatoria",
      });
    }

    if (
      total === undefined ||
      total === null ||
      !Number.isInteger(Number(total)) ||
      Number(total) <= 0
    ) {
      return res.status(400).json({
        message: "El total debe ser un número entero mayor a 0",
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: {
        id: Number(clienteId),
      },
    });

    if (!cliente) {
      return res.status(404).json({
        message: "El cliente no existe",
      });
    }

    let fechaTrabajo: Date | undefined;

    if (fecha) {
      const fechaParseada = new Date(fecha);

      if (Number.isNaN(fechaParseada.getTime())) {
        return res.status(400).json({
          message: "La fecha es inválida",
        });
      }

      fechaTrabajo = fechaParseada;
    }

    const trabajo = await prisma.trabajo.create({
      data: {
        clienteId: Number(clienteId),
        descripcion: descripcion.trim(),
        total: Number(total),
        ...(fechaTrabajo
          ? {
              fecha: fechaTrabajo,
            }
          : {}),
      },
      include: {
        cliente: true,
        pagos: true,
      },
    });

    res.status(201).json(trabajo);
  } catch (error) {
    console.error("Error al crear trabajo:", error);

    res.status(500).json({
      message: "Error al crear el trabajo",
    });
  }
});

export default router;
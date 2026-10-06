import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/clientes
router.get("/", async (_req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: {
        nombre: "asc",
      },
    });

    res.json(clientes);
  } catch (error) {
    console.error("Error al obtener clientes:", error);

    res.status(500).json({
      message: "Error al obtener los clientes",
    });
  }
});

 // GET /api/clientes/:id/resumen
router.get("/:id/resumen", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "ID de cliente inválido",
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: {
        id,
      },
      include: {
        trabajos: {
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
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({
        message: "Cliente no encontrado",
      });
    }

    let totalFacturado = 0;
    let totalPagado = 0;

    const trabajos = cliente.trabajos.map((trabajo) => {
      const pagado = trabajo.pagos.reduce(
        (total, pago) => total + pago.monto,
        0,
      );

      const deuda = Math.max(trabajo.total - pagado, 0);

      totalFacturado += trabajo.total;
      totalPagado += pagado;

      return {
        id: trabajo.id,
        fecha: trabajo.fecha,
        descripcion: trabajo.descripcion,
        total: trabajo.total,
        pagado,
        deuda,
        estado:
          deuda === 0
            ? "PAGADO"
            : pagado > 0
              ? "PAGO_PARCIAL"
              : "PENDIENTE",
        pagos: trabajo.pagos,
      };
    });

    const deuda = Math.max(totalFacturado - totalPagado, 0);

    res.json({
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        observaciones: cliente.observaciones,
      },

      resumen: {
        totalFacturado,
        totalPagado,
        deuda,
        estado: deuda > 0 ? "DEUDOR" : "AL_DIA",
      },

      trabajos,
    });
  } catch (error) {
    console.error("Error al obtener resumen del cliente:", error);

    res.status(500).json({
      message: "Error al obtener el resumen del cliente",
    });
  }
});

// GET /api/clientes/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "ID de cliente inválido",
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: {
        id,
      },
      include: {
        trabajos: {
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
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({
        message: "Cliente no encontrado",
      });
    }

    res.json(cliente);
  } catch (error) {
    console.error("Error al obtener cliente:", error);

    res.status(500).json({
      message: "Error al obtener el cliente",
    });
  }
});

// POST /api/clientes
router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      telefono,
      direccion,
      observaciones,
    } = req.body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({
        message: "El nombre es obligatorio",
      });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre: nombre.trim(),
        telefono: telefono?.trim() || null,
        direccion: direccion?.trim() || null,
        observaciones: observaciones?.trim() || null,
      },
    });

    res.status(201).json(cliente);
  } catch (error) {
    console.error("Error al crear cliente:", error);

    res.status(500).json({
      message: "Error al crear el cliente",
    });
  }
});

// PUT /api/clientes/:id
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "ID de cliente inválido",
      });
    }

    const {
      nombre,
      telefono,
      direccion,
      observaciones,
    } = req.body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({
        message: "El nombre es obligatorio",
      });
    }

    const clienteExistente = await prisma.cliente.findUnique({
      where: { id },
    });

    if (!clienteExistente) {
      return res.status(404).json({
        message: "Cliente no encontrado",
      });
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        telefono: telefono?.trim() || null,
        direccion: direccion?.trim() || null,
        observaciones: observaciones?.trim() || null,
      },
    });

    res.json(cliente);
  } catch (error) {
    console.error("Error al actualizar cliente:", error);

    res.status(500).json({
      message: "Error al actualizar el cliente",
    });
  }
});

export default router;
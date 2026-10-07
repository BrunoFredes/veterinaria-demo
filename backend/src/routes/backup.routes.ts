import { Router } from "express";

import {
  createBackup,
  listBackups,
  restoreBackup,
} from "../services/backup.service.js";

const router = Router();

/**
 * GET /api/backup
 *
 * Devuelve el estado de los backups disponibles.
 */
router.get("/", async (_req, res) => {
  try {
    const backups = await listBackups();

    res.json(backups);
  } catch (error) {
    console.error("Error obteniendo backups:", error);

    res.status(500).json({
      message: "No se pudieron obtener los backups",
    });
  }
});

/**
 * POST /api/backup
 *
 * Crea un backup manual.
 */
router.post("/", async (_req, res) => {
  try {
    const backup = await createBackup("manual");

    res.status(201).json({
      message: "Backup creado correctamente",
      backup,
    });
  } catch (error) {
    console.error("Error creando backup:", error);

    res.status(500).json({
      message: "No se pudo crear el backup",
    });
  }
});

/**
 * POST /api/backup/restore
 *
 * Restaura el backup automático o manual.
 */
router.post("/restore", async (req, res) => {
  try {
    const { type } = req.body;

    if (type !== "automatic" && type !== "manual") {
      return res.status(400).json({
        message:
          "El tipo de backup debe ser automatic o manual",
      });
    }

    const result = await restoreBackup(type);

    res.json({
      message:
        "Backup restaurado correctamente. El backend debe reiniciarse.",
      result,
    });

    /*
     * Damos tiempo a Express para enviar la respuesta
     * antes de cerrar el proceso.
     */
    setTimeout(() => {
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error("Error restaurando backup:", error);

    res.status(500).json({
      message: "No se pudo restaurar el backup",
    });
  }
});

export default router;
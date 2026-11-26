
import express from "express";
import cors from "cors";

import clientesRouter from "./routes/clientes.routes.js";
import trabajosRouter from "./routes/trabajos.routes.js";
import pagosRouter from "./routes/pagos.routes.js";
import movimientosRouter from "./routes/movimientos.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

import { ensureDemoDataFresh } from "./services/demo-reset.service.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Comprobar si los datos de demostración necesitan restaurarse.
app.use(async (_req, res, next) => {
  try {
    await ensureDemoDataFresh();
    next();
  } catch (error) {
    console.error("Error comprobando los datos demo:", error);
    next(error);
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Backend funcionando correctamente",
  });
});

app.use("/api/clientes", clientesRouter);
app.use("/api/trabajos", trabajosRouter);
app.use("/api/pagos", pagosRouter);
app.use("/api/movimientos", movimientosRouter);
app.use("/api/dashboard", dashboardRouter);

// Manejo básico de errores.
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({
    error: "Error interno del servidor",
  });
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en el puerto ${PORT}`);
});

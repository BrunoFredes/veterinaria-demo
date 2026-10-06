import express from "express";
import cors from "cors";

import clientesRouter from "./routes/clientes.routes.js";
import trabajosRouter from "./routes/trabajos.routes.js";
import pagosRouter from "./routes/pagos.routes.js";
import movimientosRouter from "./routes/movimientos.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});

import { prisma } from "../src/lib/prisma.js";
import { populateDemoData } from "../src/services/demo-reset.service.js";

async function main() {
  console.log("Preparando datos de demostración...");

  const counts = await prisma.$transaction(async (tx) => {
    return populateDemoData(tx);
  });

  console.log("Datos ficticios cargados correctamente.");
  console.log(`Clientes: ${counts.clientes}`);
  console.log(`Trabajos: ${counts.trabajos}`);
  console.log(`Pagos: ${counts.pagos}`);
  console.log(`Egresos: ${counts.egresos}`);
}

main()
  .catch((error) => {
    console.error("Error cargando los datos demo:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

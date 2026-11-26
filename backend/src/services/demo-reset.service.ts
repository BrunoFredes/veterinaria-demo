
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;

type Transaction = Prisma.TransactionClient;

function daysAgo(days: number, hour = 11): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

const clientesData = [
  { nombre: "María González", telefono: "3456123456", direccion: "San Martín 425", observaciones: "Tiene dos mascotas" },
  { nombre: "Juan Pérez", telefono: "3456234567", direccion: "Entre Ríos 820", observaciones: "Prefiere contacto por WhatsApp" },
  { nombre: "Lucía Fernández", telefono: "3456345678", direccion: "Urquiza 112", observaciones: null },
  { nombre: "Carlos Rodríguez", telefono: "3456456789", direccion: "Alvear 560", observaciones: "Cliente frecuente" },
  { nombre: "Sofía Martínez", telefono: "3456567890", direccion: "Belgrano 230", observaciones: null },
  { nombre: "Diego López", telefono: "3456678901", direccion: "Brown 710", observaciones: "Tiene tres mascotas" },
  { nombre: "Valentina Torres", telefono: "3456789012", direccion: "25 de Mayo 340", observaciones: null },
  { nombre: "Andrés Romero", telefono: "3456890123", direccion: "Pellegrini 190", observaciones: "Prefiere turnos por la mañana" },
  { nombre: "Camila Díaz", telefono: "3456901234", direccion: "Sarmiento 640", observaciones: null },
  { nombre: "Martín Acosta", telefono: "3456012345", direccion: "Rocamora 350", observaciones: "Cliente frecuente" },
];

const trabajosData = [
  { cliente: 0, descripcion: "Consulta general - Luna", total: 18000, dias: 0, pagos: [{ monto: 18000, medio: "EFECTIVO", dias: 0 }] },
  { cliente: 1, descripcion: "Vacunación anual - Toby", total: 25000, dias: 1, pagos: [{ monto: 25000, medio: "TRANSFERENCIA", dias: 1 }] },
  { cliente: 2, descripcion: "Control clínico - Michi", total: 15000, dias: 2, pagos: [{ monto: 10000, medio: "EFECTIVO", dias: 2 }] },
  { cliente: 3, descripcion: "Limpieza dental - Rocky", total: 65000, dias: 3, pagos: [{ monto: 30000, medio: "TARJETA", dias: 3 }, { monto: 20000, medio: "EFECTIVO", dias: 1 }] },
  { cliente: 4, descripcion: "Desparasitación - Nala", total: 12000, dias: 4, pagos: [{ monto: 12000, medio: "EFECTIVO", dias: 4 }] },
  { cliente: 5, descripcion: "Consulta de urgencia - Max", total: 35000, dias: 5, pagos: [{ monto: 35000, medio: "TRANSFERENCIA", dias: 5 }] },
  { cliente: 6, descripcion: "Vacunación - Milo", total: 22000, dias: 6, pagos: [] },
  { cliente: 7, descripcion: "Control postoperatorio - Simón", total: 28000, dias: 7, pagos: [{ monto: 15000, medio: "EFECTIVO", dias: 7 }] },
  { cliente: 8, descripcion: "Consulta general - Lola", total: 18000, dias: 8, pagos: [{ monto: 18000, medio: "TARJETA", dias: 8 }] },
  { cliente: 9, descripcion: "Cirugía menor - Firulais", total: 95000, dias: 9, pagos: [{ monto: 50000, medio: "TRANSFERENCIA", dias: 9 }, { monto: 20000, medio: "EFECTIVO", dias: 5 }] },
  { cliente: 0, descripcion: "Control de rutina - Luna", total: 14000, dias: 11, pagos: [{ monto: 14000, medio: "EFECTIVO", dias: 11 }] },
  { cliente: 2, descripcion: "Vacunación - Michi", total: 20000, dias: 13, pagos: [{ monto: 20000, medio: "TRANSFERENCIA", dias: 13 }] },
  { cliente: 4, descripcion: "Consulta dermatológica - Nala", total: 32000, dias: 15, pagos: [{ monto: 12000, medio: "EFECTIVO", dias: 15 }] },
  { cliente: 6, descripcion: "Control general - Milo", total: 16000, dias: 18, pagos: [{ monto: 16000, medio: "EFECTIVO", dias: 18 }] },
  { cliente: 9, descripcion: "Vacunación - Firulais", total: 24000, dias: 20, pagos: [{ monto: 24000, medio: "TARJETA", dias: 20 }] },
];

const egresosData = [
  { concepto: "Compra de medicamentos e insumos", monto: 18500, medioPago: "EFECTIVO", dias: 1 },
  { concepto: "Compra de vacunas", monto: 32000, medioPago: "TRANSFERENCIA", dias: 4 },
  { concepto: "Material descartable", monto: 8500, medioPago: "EFECTIVO", dias: 8 },
  { concepto: "Productos de limpieza", monto: 6200, medioPago: "EFECTIVO", dias: 12 },
  { concepto: "Reposición de medicamentos", monto: 14500, medioPago: "TARJETA", dias: 16 },
];

export async function populateDemoData(tx: Transaction) {
  await tx.movimientoCaja.deleteMany();
  await tx.pago.deleteMany();
  await tx.trabajo.deleteMany();
  await tx.cliente.deleteMany();

  const clientes = [];

  for (const cliente of clientesData) {
    const nuevoCliente = await tx.cliente.create({
      data: cliente,
    });

    clientes.push(nuevoCliente);
  }

  for (const trabajoData of trabajosData) {
    const trabajo = await tx.trabajo.create({
      data: {
        clienteId: clientes[trabajoData.cliente].id,
        descripcion: trabajoData.descripcion,
        total: trabajoData.total,
        fecha: daysAgo(trabajoData.dias),
      },
    });

    for (const pagoData of trabajoData.pagos) {
      const fechaPago = daysAgo(pagoData.dias);

      const pago = await tx.pago.create({
        data: {
          trabajoId: trabajo.id,
          monto: pagoData.monto,
          medioPago: pagoData.medio,
          fecha: fechaPago,
        },
      });

      await tx.movimientoCaja.create({
        data: {
          fecha: fechaPago,
          tipo: "INGRESO",
          concepto: `Pago de ${clientes[trabajoData.cliente].nombre} - ${trabajoData.descripcion}`,
          monto: pagoData.monto,
          medioPago: pagoData.medio,
          pagoId: pago.id,
        },
      });
    }
  }

  for (const egreso of egresosData) {
    await tx.movimientoCaja.create({
      data: {
        tipo: "EGRESO",
        concepto: egreso.concepto,
        monto: egreso.monto,
        medioPago: egreso.medioPago,
        fecha: daysAgo(egreso.dias),
      },
    });
  }

  return {
    clientes: clientesData.length,
    trabajos: trabajosData.length,
    pagos: trabajosData.reduce((total, trabajo) => total + trabajo.pagos.length, 0),
    egresos: egresosData.length,
  };
}

let lastCheckAt = 0;
let pendingCheck: Promise<void> | null = null;

export async function ensureDemoDataFresh(): Promise<void> {
  if (Date.now() - lastCheckAt < 30_000) {
    return;
  }

  if (pendingCheck) {
    return pendingCheck;
  }

  pendingCheck = prisma.$transaction(
    async (tx) => {
      // Crea el registro inicial si todavía no existe.
      // La fecha de 1970 fuerza una restauración inicial.
      await tx.$executeRaw`
        INSERT INTO "DemoState" ("id", "lastResetAt")
        VALUES (1, '1970-01-01T00:00:00.000Z')
        ON CONFLICT ("id") DO NOTHING
      `;

      // Bloquea el registro para evitar reinicios simultáneos.
      await tx.$queryRaw`
        SELECT "id"
        FROM "DemoState"
        WHERE "id" = 1
        FOR UPDATE
      `;

      const state = await tx.demoState.findUnique({
        where: { id: 1 },
      });

      if (!state) {
        throw new Error("No se pudo obtener el estado de la demo");
      }

      const now = new Date();
      const elapsed = now.getTime() - state.lastResetAt.getTime();

      if (elapsed >= RESET_INTERVAL_MS) {
        const counts = await populateDemoData(tx);

        await tx.demoState.update({
          where: { id: 1 },
          data: { lastResetAt: now },
        });

        console.log("Datos demo restaurados automáticamente:", counts);
      }
    },
    {
      maxWait: 10000,
      timeout: 30000,
    },
  )
    .then(() => {
      lastCheckAt = Date.now();
    })
    .finally(() => {
      pendingCheck = null;
    });

  return pendingCheck;
}

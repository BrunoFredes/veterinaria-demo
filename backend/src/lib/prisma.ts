
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL no está definida");
}

if (!databaseUrl.startsWith("postgresql://") &&
    !databaseUrl.startsWith("postgres://")) {
  throw new Error(
    "DATABASE_URL debe contener una URL válida de PostgreSQL"
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

export const prisma = new PrismaClient({
  adapter,
});

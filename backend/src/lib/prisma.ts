import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL no está definida");
}

if (!databaseUrl.startsWith("file:")) {
  throw new Error("DATABASE_URL debe usar SQLite con el formato file:...");
}

const databasePath = databaseUrl.replace(/^file:/, "");

const adapter = new PrismaBetterSqlite3({
  url: databasePath,
});

export const prisma = new PrismaClient({
  adapter,
});
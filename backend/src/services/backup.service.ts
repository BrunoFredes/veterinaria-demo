import fs from "node:fs/promises";
import path from "node:path";

import { prisma, databasePath } from "../lib/prisma.js";

const backupDirectory = path.join(
  path.dirname(databasePath),
  "backups"
);

const AUTOMATIC_BACKUP_NAME = "automatic.db";
const MANUAL_BACKUP_NAME = "manual.db";
const PRE_RESTORE_BACKUP_NAME = "pre-restore.db";

type BackupType = "automatic" | "manual" | "pre-restore";

interface BackupInfo {
  type: BackupType;
  filename: string;
  path: string;
  exists: boolean;
  sizeBytes: number | null;
  createdAt: Date | null;
}

async function ensureBackupDirectory() {
  await fs.mkdir(backupDirectory, {
    recursive: true,
  });
}

function getBackupFilename(type: BackupType) {
  switch (type) {
    case "automatic":
      return AUTOMATIC_BACKUP_NAME;

    case "manual":
      return MANUAL_BACKUP_NAME;

    case "pre-restore":
      return PRE_RESTORE_BACKUP_NAME;
  }
}

function escapeSqlString(value: string) {
  return value.replaceAll("'", "''");
}

async function createBackup(type: BackupType): Promise<BackupInfo> {
  await ensureBackupDirectory();

  const filename = getBackupFilename(type);
  const destination = path.join(backupDirectory, filename);
  const temporaryDestination = `${destination}.tmp`;

  // Si quedó un temporal de una operación anterior,
  // lo eliminamos antes de empezar.
  await fs.rm(temporaryDestination, {
    force: true,
  });

  const escapedDestination = escapeSqlString(
    temporaryDestination
  );

  try {
    await prisma.$executeRawUnsafe(
      `VACUUM INTO '${escapedDestination}'`
    );

    // Reemplazamos el backup anterior solamente
    // después de que la nueva copia terminó correctamente.
    await fs.rm(destination, {
      force: true,
    });

    await fs.rename(
      temporaryDestination,
      destination
    );
  } catch (error) {
    await fs.rm(temporaryDestination, {
      force: true,
    });

    throw error;
  }

  return getBackupInfo(type);
}

async function getBackupInfo(
  type: BackupType
): Promise<BackupInfo> {
  const filename = getBackupFilename(type);
  const backupPath = path.join(
    backupDirectory,
    filename
  );

  try {
    const stats = await fs.stat(backupPath);

    return {
      type,
      filename,
      path: backupPath,
      exists: true,
      sizeBytes: stats.size,
      createdAt: stats.mtime,
    };
  } catch {
    return {
      type,
      filename,
      path: backupPath,
      exists: false,
      sizeBytes: null,
      createdAt: null,
    };
  }
}

async function listBackups() {
  await ensureBackupDirectory();

  return {
    automatic: await getBackupInfo("automatic"),
    manual: await getBackupInfo("manual"),
    preRestore: await getBackupInfo("pre-restore"),
  };
}

async function restoreBackup(
  type: "automatic" | "manual"
) {
  const backupInfo = await getBackupInfo(type);

  if (!backupInfo.exists) {
    throw new Error(
      `No existe el backup ${type}`
    );
  }

  // Antes de restaurar, guardamos el estado actual.
  await createBackup("pre-restore");

  /*
   * IMPORTANTE:
   *
   * Prisma mantiene abierta la conexión con SQLite.
   * Por eso debemos desconectarla antes de reemplazar
   * físicamente el archivo de la base.
   */
  await prisma.$disconnect();

  await fs.copyFile(
    backupInfo.path,
    databasePath
  );

  return {
    restoredFrom: backupInfo.filename,
    databasePath,
  };
}

export {
  createBackup,
  listBackups,
  restoreBackup,
};
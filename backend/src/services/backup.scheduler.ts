import { createBackup, listBackups } from "./backup.service.js";

const automaticBackupEnabled =
  process.env.BACKUP_AUTOMATICO === "true";

const intervalHours = Number(
  process.env.BACKUP_INTERVAL_HOURS ?? 24
);

const intervalMilliseconds = intervalHours * 60 * 60 * 1000;

let backupInterval: NodeJS.Timeout | null = null;

async function shouldCreateAutomaticBackup() {
  const backups = await listBackups();

  if (!backups.automatic.exists) {
    return true;
  }

  if (!backups.automatic.createdAt) {
    return true;
  }

  const elapsed =
    Date.now() - backups.automatic.createdAt.getTime();

  return elapsed >= intervalMilliseconds;
}

async function runAutomaticBackup() {
  if (!automaticBackupEnabled) {
    return;
  }

  try {
    const shouldBackup = await shouldCreateAutomaticBackup();

    if (!shouldBackup) {
      return;
    }

    await createBackup("automatic");

    console.log("Backup automático creado correctamente.");
  } catch (error) {
    console.error(
      "Error creando backup automático:",
      error
    );
  }
}

export async function startBackupScheduler() {
  if (!automaticBackupEnabled) {
    console.log("Backup automático desactivado.");
    return;
  }

  console.log(
    `Backup automático habilitado cada ${intervalHours} horas.`
  );

  await runAutomaticBackup();

  backupInterval = setInterval(
    runAutomaticBackup,
    intervalMilliseconds
  );
}

export function stopBackupScheduler() {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
  }
}
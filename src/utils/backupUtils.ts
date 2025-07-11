import * as fs from 'fs/promises';
import * as path from 'path';

const BACKUP_DIR = '.backups';

export async function createBackup(name: string) {
  try {
    // Create backup directory if it doesn't exist
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    // Create timestamped backup folder
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `${name}_${timestamp}`);
    await fs.mkdir(backupPath, { recursive: true });

    // Copy all source files
    await copyDir('src', path.join(backupPath, 'src'));

    // Copy config files
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.js'
    ];

    for (const file of configFiles) {
      try {
        await fs.copyFile(file, path.join(backupPath, file));
      } catch (err) {
        console.warn(`Warning: Could not backup ${file}`);
      }
    }

    return backupPath;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

export async function restoreBackup(backupPath: string) {
  try {
    // Restore source files
    await copyDir(path.join(backupPath, 'src'), 'src');

    // Restore config files
    const files = await fs.readdir(backupPath);
    for (const file of files) {
      if (file !== 'src') {
        await fs.copyFile(path.join(backupPath, file), file);
      }
    }
  } catch (error) {
    console.error('Restore failed:', error);
    throw error;
  }
}

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function listBackups() {
  try {
    const backups = await fs.readdir(BACKUP_DIR);
    return backups.sort().reverse(); // Most recent first
  } catch {
    return [];
  }
}
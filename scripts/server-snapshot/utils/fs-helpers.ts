import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { runCommand } from './shell';
import type { PathStat } from '../types';

export async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function getPathStat(targetPath: string): Promise<PathStat> {
  const exists = await fileExists(targetPath);
  if (!exists) {
    return { path: targetPath, exists: false };
  }

  const info = await stat(targetPath);
  let size: string | undefined;

  if (info.isDirectory()) {
    const du = await runCommand('du', ['-sh', targetPath]);
    size = du.stdout.split('\t')[0] || undefined;
  } else {
    size = formatBytes(info.size);
  }

  return {
    path: targetPath,
    exists: true,
    size,
    mtime: info.mtime,
    isDirectory: info.isDirectory(),
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', { hour12: false });
}

export function formatSnapshotTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

export async function ensureDiagnosticsDir(repoRoot: string): Promise<string> {
  const dir = path.join(repoRoot, 'diagnostics');
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

export async function writeSnapshot(
  outputPath: string,
  content: string,
): Promise<void> {
  await writeFile(outputPath, content, 'utf8');
}

export function sectionTitle(number: number, title: string): string {
  const line = '='.repeat(80);
  return `${line}\n${number}. ${title.toUpperCase()}\n${line}`;
}

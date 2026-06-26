import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import {
  formatBytes,
  formatDateTime,
  sectionTitle,
} from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

const TAIL_FILES = [
  'api-error.log',
  'api-out.log',
  'web-error.log',
  'web-out.log',
] as const;

async function listLogDirectory(logDir: string): Promise<string[]> {
  const lines: string[] = [];
  lines.push(`Pasta: ${logDir}`);

  try {
    const entries = await readdir(logDir, { withFileTypes: true });

    if (!entries.length) {
      lines.push('(vazia)');
      return lines;
    }

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const fullPath = path.join(logDir, entry.name);
      const info = await stat(fullPath);
      lines.push(
        `- ${entry.name} | ${entry.isDirectory() ? 'dir' : formatBytes(info.size)} | modificado: ${formatDateTime(info.mtime)}`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    lines.push(`(erro ao listar: ${message})`);
  }

  return lines;
}

async function tailFile(filePath: string, maxLines: number): Promise<string[]> {
  const lines: string[] = [];
  lines.push(`Últimas ${maxLines} linhas de ${filePath}:`);

  try {
    const content = await readFile(filePath, 'utf8');
    const rows = content.split(/\r?\n/).filter(Boolean);
    const tail = rows.slice(-maxLines);
    if (!tail.length) {
      lines.push('(arquivo vazio)');
    } else {
      lines.push(...tail);
    }
  } catch {
    lines.push('(arquivo não encontrado)');
  }

  return lines;
}

export async function collectLogs(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(10, 'Logs'));

  const logDirs = [
    path.join(ctx.repoRoot, 'logs'),
    ctx.envValues.get('LOG_PATH')
      ? path.isAbsolute(ctx.envValues.get('LOG_PATH')!)
        ? ctx.envValues.get('LOG_PATH')!
        : path.join(ctx.repoRoot, ctx.envValues.get('LOG_PATH')!)
      : null,
  ].filter((value, index, array): value is string => {
    return Boolean(value) && array.indexOf(value) === index;
  });

  let foundDir = false;

  for (const logDir of logDirs) {
    try {
      await stat(logDir);
      foundDir = true;
      linesPushAll(ctx.lines, await listLogDirectory(logDir));
      ctx.lines.push('');
    } catch {
      ctx.lines.push(`Pasta: ${logDir}`);
      ctx.lines.push('(não encontrada)');
      ctx.lines.push('');
    }
  }

  if (!foundDir) {
    ctx.problems.push('Pasta logs não encontrada');
  }

  for (const fileName of TAIL_FILES) {
    const candidates = logDirs.map(dir => path.join(dir, fileName));
    let printed = false;

    for (const candidate of candidates) {
      try {
        await stat(candidate);
        ctx.lines.push(...(await tailFile(candidate, 30)));
        ctx.lines.push('');
        printed = true;
        break;
      } catch {
        // tenta próximo diretório
      }
    }

    if (!printed) {
      ctx.lines.push(`${fileName}: (não encontrado)`);
      ctx.lines.push('');
    }
  }
}

function linesPushAll(target: string[], source: string[]): void {
  for (const line of source) target.push(line);
}

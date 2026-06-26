import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { sectionTitle } from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

const NGINX_DIRS = ['/etc/nginx/sites-enabled', '/etc/nginx/conf.d'] as const;

async function listConfigFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await listConfigFiles(fullPath)));
      } else {
        files.push(fullPath);
      }
    }
  } catch {
    return files;
  }

  return files;
}

export async function collectNginx(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(13, 'Nginx'));

  let foundAny = false;

  for (const dir of NGINX_DIRS) {
    ctx.lines.push(`Diretório: ${dir}`);

    try {
      await stat(dir);
      const files = await listConfigFiles(dir);

      if (!files.length) {
        ctx.lines.push('(sem arquivos)');
        ctx.lines.push('');
        continue;
      }

      foundAny = true;

      for (const filePath of files.sort()) {
        const content = await readFile(filePath, 'utf8');
        ctx.lines.push(`--- ${filePath} ---`);
        ctx.lines.push(content);
        ctx.lines.push('');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.lines.push(`(indisponível: ${message})`);
      ctx.lines.push('');
    }
  }

  if (!foundAny) {
    ctx.lines.push(
      '(nenhuma configuração Nginx acessível — normal em ambiente local ou sem permissão)',
    );
    ctx.lines.push('');
  }
}

import path from 'node:path';

import {
  formatDateTime,
  getPathStat,
  sectionTitle,
} from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

const UPLOAD_KEYS = [
  'UPLOAD_ROOT',
  'UPLOAD_STORAGE',
  'UPLOAD_BASE_URL',
  'UPLOAD_LEGACY_ROOTS',
  'NEXT_PUBLIC_PHOTOS_BASE_URL',
] as const;

function resolveUploadPaths(ctx: SnapshotContext): string[] {
  const paths = new Set<string>();

  const uploadRoot = ctx.envValues.get('UPLOAD_ROOT');
  if (uploadRoot) paths.add(uploadRoot);

  const legacy = ctx.envValues.get('UPLOAD_LEGACY_ROOTS');
  if (legacy) {
    const trimmed = legacy.trim();
    if (trimmed.startsWith('[')) {
      try {
        const arr = JSON.parse(trimmed) as unknown;
        if (Array.isArray(arr)) {
          for (const item of arr) paths.add(String(item));
        }
      } catch {
        for (const item of trimmed.split(',')) {
          const value = item.trim();
          if (value) paths.add(value);
        }
      }
    } else {
      for (const item of trimmed.split(',')) {
        const value = item.trim();
        if (value) paths.add(value);
      }
    }
  }

  paths.add(path.join(ctx.repoRoot, 'uploads'));

  return [...paths].map(candidate =>
    path.isAbsolute(candidate)
      ? candidate
      : path.join(ctx.repoRoot, candidate),
  );
}

export async function collectUploads(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(8, 'Uploads'));

  for (const key of UPLOAD_KEYS) {
    const value = ctx.envValues.get(key);
    ctx.lines.push(`${key}=${value ?? '(não definido)'}`);
  }

  ctx.lines.push('');
  ctx.lines.push('Verificação de diretórios:');

  const directories = resolveUploadPaths(ctx);

  for (const dir of directories) {
    const info = await getPathStat(dir);
    const status = info.exists ? '✔ existe' : '✘ não existe';
    const size = info.size ? ` | tamanho: ${info.size}` : '';
    const mtime = info.mtime ? ` | modificado: ${formatDateTime(info.mtime)}` : '';

    ctx.lines.push(`${status} | ${dir}${size}${mtime}`);

    if (!info.exists) {
      ctx.problems.push(`Diretório de upload inexistente: ${dir}`);
    }
  }

  ctx.lines.push('');
}

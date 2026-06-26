import { parseDatabaseUrl } from '../utils/env-parse';
import { sectionTitle } from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

export async function collectDatabase(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(15, 'Banco'));

  const databaseUrl = ctx.envValues.get('DATABASE_URL');

  if (!databaseUrl) {
    ctx.lines.push('DATABASE_URL: (não encontrada nos .env coletados)');
    ctx.problems.push('DATABASE_URL ausente');
    ctx.lines.push('');
    return;
  }

  const parsed = parseDatabaseUrl(databaseUrl);

  if (parsed.error) {
    ctx.lines.push(`Erro: ${parsed.error}`);
    ctx.problems.push(parsed.error);
    ctx.lines.push('');
    return;
  }

  ctx.lines.push(`host: ${parsed.host ?? 'n/d'}`);
  ctx.lines.push(`porta: ${parsed.port || '(padrão)'}`);
  ctx.lines.push(`database: ${parsed.database ?? 'n/d'}`);
  ctx.lines.push(`usuário: ${parsed.user ?? 'n/d'}`);
  ctx.lines.push('senha: ********');
  ctx.lines.push('');
}

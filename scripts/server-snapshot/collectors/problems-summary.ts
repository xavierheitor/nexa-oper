import { sectionTitle } from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

export async function collectProblemsSummary(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(16, 'Resumo final'));
  ctx.lines.push('Problemas encontrados:');

  const uniqueProblems = [...new Set(ctx.problems)];

  if (!uniqueProblems.length) {
    ctx.lines.push('✔ Nenhum problema detectado automaticamente.');
  } else {
    for (const problem of uniqueProblems) {
      ctx.lines.push(`✘ ${problem}`);
    }
  }

  ctx.lines.push('');
  ctx.lines.push(`Total de problemas: ${uniqueProblems.length}`);
  ctx.lines.push('');
}

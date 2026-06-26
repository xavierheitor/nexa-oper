import { appendCommandBlock, runCommand } from '../utils/shell';
import { sectionTitle } from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

export async function collectGit(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(3, 'Git'));

  const commands = [
    ['git branch --show-current', ['branch', '--show-current']],
    ['git log -1 --oneline', ['log', '-1', '--oneline']],
    ['git log -10 --oneline', ['log', '-10', '--oneline']],
    ['git status --short --branch', ['status', '--short', '--branch']],
    ['git remote get-url origin', ['remote', 'get-url', 'origin']],
  ] as const;

  for (const [label, args] of commands) {
    const result = await runCommand('git', [...args], { cwd: ctx.repoRoot });
    appendCommandBlock(ctx.lines, label, `git ${args.join(' ')}`, result);

    if (result.error?.includes('não encontrado')) {
      ctx.problems.push('Git não está instalado ou não está no PATH');
      break;
    }
  }
}

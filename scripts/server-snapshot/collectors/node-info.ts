import { appendCommandBlock, runCommand } from '../utils/shell';
import { sectionTitle } from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

const NODE_COMMANDS = [
  ['node', ['-v']],
  ['npm', ['-v']],
  ['npx', ['-v']],
  ['pm2', ['-v']],
] as const;

export async function collectNode(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(2, 'Node'));

  for (const [command, args] of NODE_COMMANDS) {
    const result = await runCommand(command, [...args]);
    appendCommandBlock(
      ctx.lines,
      `${command}:`,
      `${command} ${args.join(' ')}`,
      result,
    );

    if (result.error) {
      ctx.problems.push(`Comando indisponível: ${command}`);
    }
  }
}

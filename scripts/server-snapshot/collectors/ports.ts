import { appendCommandBlock, runCommand } from '../utils/shell';
import { sectionTitle } from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

const PORT_FILTERS = ['node', 'nginx', 'mysql', 'redis'];

export async function collectPorts(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(11, 'Portas'));

  let result = await runCommand('ss', ['-tulpn']);
  let commandLabel = 'ss -tulpn';

  if (result.error) {
    const netstat = await runCommand('netstat', ['-tulpn']);
    if (!netstat.error) {
      result = netstat;
      commandLabel = 'netstat -tulpn';
    } else {
      const lsof = await runCommand('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN']);
      if (!lsof.error) {
        result = lsof;
        commandLabel = 'lsof -nP -iTCP -sTCP:LISTEN';
      }
    }
  }

  appendCommandBlock(ctx.lines, commandLabel, commandLabel, result);

  if (result.error) {
    ctx.problems.push('Não foi possível listar portas (ss/netstat/lsof indisponíveis)');
    return;
  }

  ctx.lines.push('Filtrado (node, nginx, mysql, redis):');
  const filtered = result.stdout
    .split('\n')
    .filter(line =>
      PORT_FILTERS.some(keyword => line.toLowerCase().includes(keyword)),
    );

  if (!filtered.length) {
    ctx.lines.push('(nenhuma linha correspondente)');
  } else {
    ctx.lines.push(...filtered);
  }

  ctx.lines.push('');
}

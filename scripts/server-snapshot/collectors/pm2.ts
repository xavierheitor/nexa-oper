import { appendCommandBlock, runCommand } from '../utils/shell';
import { sectionTitle } from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

interface Pm2Process {
  name?: string;
  pm_id?: number;
  pid?: number;
  pm2_env?: {
    status?: string;
    cwd?: string;
    pm_exec_path?: string;
    pm_cwd?: string;
    instances?: number;
    restart_time?: number;
    env?: Record<string, string>;
  };
  monit?: {
    memory?: number;
    cpu?: number;
  };
}

export async function collectPm2(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(5, 'PM2'));

  const list = await runCommand('pm2', ['list']);
  appendCommandBlock(ctx.lines, 'pm2 list', 'pm2 list', list);

  const jlist = await runCommand('pm2', ['jlist']);
  appendCommandBlock(ctx.lines, 'pm2 jlist', 'pm2 jlist', jlist);

  const pretty = await runCommand('pm2', ['prettylist']);
  appendCommandBlock(ctx.lines, 'pm2 prettylist', 'pm2 prettylist', pretty);

  if (list.error) {
    ctx.problems.push('PM2 não está instalado ou não está no PATH');
    return;
  }

  if (!jlist.stdout) return;

  try {
    const processes = JSON.parse(jlist.stdout) as Pm2Process[];
    ctx.lines.push('Resumo dos processos PM2:');

    if (!processes.length) {
      ctx.lines.push('(nenhum processo)');
      ctx.problems.push('PM2 sem processos em execução');
      ctx.lines.push('');
      return;
    }

    for (const proc of processes) {
      const env = proc.pm2_env;
      const memoryMb = proc.monit?.memory
        ? `${(proc.monit.memory / (1024 * 1024)).toFixed(1)} MB`
        : 'n/d';

      ctx.lines.push(`- ${proc.name ?? 'sem-nome'} (id=${proc.pm_id ?? 'n/d'})`);
      ctx.lines.push(`  status: ${env?.status ?? 'n/d'}`);
      ctx.lines.push(`  cwd: ${env?.pm_cwd ?? env?.cwd ?? 'n/d'}`);
      ctx.lines.push(`  script: ${env?.pm_exec_path ?? 'n/d'}`);
      ctx.lines.push(`  instances: ${env?.instances ?? 'n/d'}`);
      ctx.lines.push(`  memory: ${memoryMb}`);
      ctx.lines.push(`  restart count: ${env?.restart_time ?? 0}`);

      if (env?.status && env.status !== 'online') {
        ctx.problems.push(`PM2 processo "${proc.name}" com status ${env.status}`);
      }

      if (env?.env) {
        ctx.lines.push('  env (chaves):');
        const keys = Object.keys(env.env).sort();
        for (const key of keys) {
          ctx.lines.push(`    - ${key}`);
        }
      }

      ctx.lines.push('');
    }
  } catch {
    ctx.problems.push('Não foi possível interpretar a saída do pm2 jlist');
    ctx.lines.push('(falha ao parsear pm2 jlist como JSON)');
    ctx.lines.push('');
  }
}

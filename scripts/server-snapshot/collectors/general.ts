import os from 'node:os';

import { sectionTitle } from '../utils/fs-helpers';
import { runCommand } from '../utils/shell';
import type { SnapshotContext } from '../types';

export async function collectGeneral(ctx: SnapshotContext): Promise<void> {
  const { lines } = ctx;
  const now = new Date();

  const uptime =
    process.platform === 'darwin'
      ? await runCommand('uptime')
      : await runCommand('uptime', ['-p']);
  const kernel = await runCommand('uname', ['-r']);
  const osRelease = await runCommand('cat', ['/etc/os-release']);

  lines.push(sectionTitle(1, 'Informações gerais'));
  lines.push(`Data/Hora: ${now.toLocaleString('pt-BR', { hour12: false })}`);
  lines.push(`Hostname: ${os.hostname()}`);
  lines.push(`Sistema operacional: ${os.type()} ${os.release()} (${os.arch()})`);

  if (osRelease.stdout) {
    const pretty = osRelease.stdout
      .split('\n')
      .find(line => line.startsWith('PRETTY_NAME='));
    if (pretty) {
      lines.push(`Distribuição: ${pretty.replace(/^PRETTY_NAME="?|"?$/g, '')}`);
    }
  }

  lines.push(`Kernel: ${kernel.stdout || os.release()}`);
  lines.push(`Usuário: ${os.userInfo().username}`);
  lines.push(`Diretório atual: ${process.cwd()}`);
  lines.push(`Repositório: ${ctx.repoRoot}`);
  lines.push(`Uptime: ${uptime.stdout || '(indisponível)'}`);
  lines.push('');
}

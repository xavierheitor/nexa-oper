import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import type { CommandResult } from '../types';

const execFileAsync = promisify(execFile);

export async function runCommand(
  command: string,
  args: string[] = [],
  options: { cwd?: string; timeoutMs?: number } = {},
): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: options.cwd,
      timeout: options.timeoutMs ?? 30_000,
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf8',
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
      code?: number;
    };

    if (err.code === 'ENOENT') {
      return {
        stdout: '',
        stderr: '',
        exitCode: null,
        error: `Comando não encontrado: ${command}`,
      };
    }

    return {
      stdout: (err.stdout ?? '').trim(),
      stderr: (err.stderr ?? '').trim(),
      exitCode: typeof err.code === 'number' ? err.code : 1,
      error: err.message,
    };
  }
}

export function appendCommandBlock(
  lines: string[],
  title: string,
  command: string,
  result: CommandResult,
): void {
  lines.push(title);
  lines.push(`$ ${command}`);

  if (result.error) {
    lines.push(`(erro: ${result.error})`);
  }

  if (result.stdout) {
    lines.push(result.stdout);
  } else {
    lines.push('(sem saída stdout)');
  }

  if (result.stderr) {
    lines.push('--- stderr ---');
    lines.push(result.stderr);
  }

  lines.push('');
}

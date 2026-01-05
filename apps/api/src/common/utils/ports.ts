import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export async function isPortInUse(port: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function killPortProcesses(port: number): Promise<void> {
  const { stdout } = await execAsync(`lsof -ti:${port}`);
  const pids = stdout
    .trim()
    .split('\n')
    .filter(pid => pid.length > 0);

  for (const pid of pids) {
    try {
      // Tentar SIGTERM primeiro (graceful shutdown)
      await execAsync(`kill -15 ${pid}`);
      // Aguardar 2 segundos para o processo finalizar
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Se ainda estiver rodando, forçar com SIGKILL
      await execAsync(`kill -9 ${pid}`);
    } catch {
      // ignore
    }
  }
}

export async function ensurePortFree(
  port: number,
  onLog?: (msg: string) => void
): Promise<void> {
  if (await isPortInUse(port)) {
    onLog?.(`⚠️  Porta ${port} em uso. Liberando...`);
    await killPortProcesses(port);
    if (await isPortInUse(port)) {
      throw new Error(`Falha ao liberar porta ${port}`);
    }
    onLog?.(`✅ Porta ${port} liberada`);
  } else {
    onLog?.(`✅ Porta ${port} livre`);
  }
}

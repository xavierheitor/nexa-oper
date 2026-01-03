/**
 * Utilitário de Lock Distribuído para Jobs Agendados
 *
 * Implementa um sistema de lock via banco de dados para garantir que jobs
 * agendados sejam executados apenas uma vez mesmo com múltiplas instâncias.
 *
 * COMO FUNCIONA:
 * - Lock é adquirido definindo lockedAt e expiresAt
 * - Lock expira automaticamente após TTL
 * - Outras instâncias verificam se lock está expirado antes de adquirir
 * - Lock deve ser liberado explicitamente após conclusão (try/finally)
 */

import { PrismaClient } from '@nexa-oper/db';

/**
 * Adquire um lock para um job específico
 *
 * @param prisma - Instância do Prisma Client
 * @param jobName - Nome único do job
 * @param ttlMs - Tempo de vida do lock em milissegundos
 * @param lockedBy - Identificador de quem está adquirindo o lock (ex: hostname, processo ID)
 * @returns true se o lock foi adquirido com sucesso, false caso contrário
 */
export async function acquireLock(
  prisma: PrismaClient,
  jobName: string,
  ttlMs: number,
  lockedBy: string
): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  try {
    // Buscar lock existente
    const existingLock = await prisma.jobLock.findUnique({
      where: { jobName },
    });

    // Se não existe, criar
    if (!existingLock) {
      await prisma.jobLock.create({
        data: {
          jobName,
          lockedAt: now,
          lockedBy,
          expiresAt,
        },
      });
      return true;
    }

    // Se existe, verificar se está expirado ou livre
    if (!existingLock.lockedAt || !existingLock.expiresAt || existingLock.expiresAt < now) {
      // Lock expirado ou livre, podemos adquirir
      await prisma.jobLock.update({
        where: { jobName },
        data: {
          lockedAt: now,
          lockedBy,
          expiresAt,
        },
      });
      return true;
    }

    // Lock está ativo e não expirado
    return false;
  } catch (error) {
    // Em caso de erro, assumir que não conseguimos adquirir o lock
    console.error(`[JobLock] Erro ao adquirir lock para ${jobName}:`, error);
    return false;
  }
}

/**
 * Libera um lock para um job específico
 *
 * @param prisma - Instância do Prisma Client
 * @param jobName - Nome único do job
 * @param lockedBy - Identificador de quem está liberando o lock (deve corresponder ao lockedBy)
 */
export async function releaseLock(
  prisma: PrismaClient,
  jobName: string,
  lockedBy: string
): Promise<void> {
  try {
    // Liberar o lock apenas se pertencer a nós
    await prisma.jobLock.updateMany({
      where: {
        jobName,
        lockedBy,
      },
      data: {
        lockedAt: null,
        lockedBy: null,
        expiresAt: null,
      },
    });
  } catch (error) {
    // Logar erro mas não lançar exceção (lock expirará naturalmente)
    console.error(`[JobLock] Erro ao liberar lock para ${jobName}:`, error);
  }
}

/**
 * Verifica se um job está atualmente com lock ativo
 *
 * @param prisma - Instância do Prisma Client
 * @param jobName - Nome único do job
 * @returns true se o lock está ativo e não expirado
 */
export async function isLocked(
  prisma: PrismaClient,
  jobName: string
): Promise<boolean> {
  const now = new Date();

  const lock = await prisma.jobLock.findUnique({
    where: { jobName },
  });

  if (!lock || !lock.lockedAt || !lock.expiresAt) {
    return false;
  }

  // Lock está ativo se não expirou
  return lock.expiresAt > now;
}

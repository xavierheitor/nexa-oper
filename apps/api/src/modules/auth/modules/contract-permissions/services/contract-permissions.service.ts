import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database';
import type { ContractPermissionsReaderPort } from '../domain/ports/contract-permissions-reader.port';

const CACHE_TTL_MS = 60_000; // 1 minuto

interface CacheEntry {
  value: boolean | number[];
  expiresAt: number;
}

@Injectable()
/**
 * Serviço responsável por gerenciar e validar as permissões de contratos dos usuários móveis.
 *
 * Utiliza um cache em memória (TTL 1 min) para reduzir a carga no banco de dados,
 * visto que essas verificações são frequentes (middleware/guards).
 */
export class ContractPermissionsService implements ContractPermissionsReaderPort {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica se um usuário tem permissão de acesso a um contrato específico.
   *
   * @param userId - ID do usuário.
   * @param contractId - ID do contrato.
   * @returns `true` se tiver permissão, `false` caso contrário.
   */
  async hasContractPermission(
    userId: number,
    contractId: number,
  ): Promise<boolean> {
    const key = `perm:${userId}:${contractId}`;
    const cached = this.get(key);
    if (typeof cached === 'boolean') return cached;

    const count = await this.prisma.mobileContratoPermissao.count({
      where: {
        mobileUserId: userId,
        contratoId: contractId,
        deletedAt: null,
      },
    });
    const result = count > 0;
    this.set(key, result, CACHE_TTL_MS);
    return result;
  }

  /**
   * Obtém a lista de IDs de contratos que o usuário tem acesso.
   *
   * @param userId - ID do usuário.
   * @returns Objeto com userId, lista de contratos e total.
   */
  async getUserContracts(
    userId: number,
  ): Promise<{ userId: number; contracts: number[]; total: number }> {
    const key = `contracts:${userId}`;
    const cached = this.get(key);
    if (Array.isArray(cached)) {
      return { userId, contracts: cached, total: cached.length };
    }

    const rows = await this.prisma.mobileContratoPermissao.findMany({
      where: { mobileUserId: userId, deletedAt: null },
      select: { contratoId: true },
    });
    const contracts = rows.map((r) => r.contratoId);
    this.set(key, contracts, CACHE_TTL_MS);
    return { userId, contracts, total: contracts.length };
  }

  /**
   * Verifica se o usuário tem permissão em PELO MENOS UM dos contratos fornecidos.
   *
   * @param userId - ID do usuário.
   * @param contractIds - Lista de IDs de contratos.
   * @returns `true` se tiver acesso a algum, `false` se não tiver a nenhum.
   */
  async hasAnyContractPermission(
    userId: number,
    contractIds: number[],
  ): Promise<boolean> {
    if (contractIds.length === 0) return false;

    const count = await this.prisma.mobileContratoPermissao.count({
      where: {
        mobileUserId: userId,
        contratoId: { in: contractIds },
        deletedAt: null,
      },
    });
    return count > 0;
  }

  invalidateUserCache(userId: number): void {
    const toDelete: string[] = [];
    for (const k of this.cache.keys()) {
      if (k.startsWith(`perm:${userId}:`) || k === `contracts:${userId}`) {
        toDelete.push(k);
      }
    }
    toDelete.forEach((k) => this.cache.delete(k));
  }

  invalidateAllCache(): void {
    this.cache.clear();
  }

  private get(key: string): boolean | number[] | undefined {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  private set(key: string, value: boolean | number[], ttlMs: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }
}

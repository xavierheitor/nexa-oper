/**
 * Serviço de sincronização de Equipe para mobile: checksum, incremental (since)
 * e payload de equipes. Respeita filtro por contratos (allowedContractIds).
 */

import { ORDER_CONFIG } from '@common/constants/equipe';
import { handleCrudError } from '@common/utils/error-handler';
import { computeSyncChecksum } from '@common/utils/sync-checksum';
import { buildSyncWhereIncremental } from '@common/utils/sync-where';
import { DatabaseService } from '@database/database.service';
import { Injectable, Logger } from '@nestjs/common';

import { EquipeSyncDto } from '../dto';

@Injectable()
export class EquipeSyncService {
  private readonly logger = new Logger(EquipeSyncService.name);

  constructor(private readonly db: DatabaseService) {}

  private buildSyncWhere(
    since: string | undefined,
    allowedContractIds: number[] | null
  ) {
    const base = buildSyncWhereIncremental(since);
    const hasContractFilter =
      allowedContractIds && allowedContractIds.length > 0;
    return hasContractFilter
      ? { AND: [base, { contratoId: { in: allowedContractIds } }] }
      : base;
  }

  private async buildSyncChecksumPayload(
    allowedContractIds: number[] | null
  ): Promise<Record<string, { count: number; maxUpdatedAt: string | null }>> {
    if (allowedContractIds && allowedContractIds.length === 0) {
      return { equipe: { count: 0, maxUpdatedAt: null } };
    }
    const where = this.buildSyncWhere(undefined, allowedContractIds);
    const a = await this.db.getPrisma().equipe.aggregate({
      where,
      _count: true,
      _max: { updatedAt: true },
    });
    const iso = (d: Date | null) => d?.toISOString() ?? null;
    return {
      equipe: { count: a._count, maxUpdatedAt: iso(a._max.updatedAt) },
    };
  }

  async getSyncStatus(
    clientChecksum?: string,
    allowedContractIds?: number[] | null
  ): Promise<{ changed: boolean; checksum: string; serverTime: string }> {
    const ids = allowedContractIds ?? null;
    if (ids && ids.length === 0) {
      const serverTime = new Date().toISOString();
      return { changed: false, checksum: 'no-access', serverTime };
    }
    this.logger.log('Calculando status de sincronização Equipe (checksum)');
    const payload = await this.buildSyncChecksumPayload(ids);
    const checksum = computeSyncChecksum(payload);
    const serverTime = new Date().toISOString();
    const changed = clientChecksum === undefined || clientChecksum !== checksum;
    this.logger.log(
      `Status Equipe: checksum=${checksum.slice(0, 16)}..., changed=${changed}`
    );
    return { changed, checksum, serverTime };
  }

  async findAllForSync(
    since: string | undefined,
    allowedContractIds?: number[] | null
  ): Promise<EquipeSyncDto[]> {
    const ids = allowedContractIds ?? null;
    if (ids && ids.length === 0) {
      this.logger.log('Nenhum contrato permitido, retornando lista vazia');
      return [];
    }
    this.logger.log(
      since
        ? `Sincronizando equipes - incremental since=${since}`
        : 'Sincronizando equipes - retorno completo'
    );
    try {
      const where = this.buildSyncWhere(since, ids);
      const data = await this.db.getPrisma().equipe.findMany({
        where,
        orderBy: ORDER_CONFIG.SYNC_ORDER,
        select: {
          id: true,
          nome: true,
          tipoEquipeId: true,
          tipoEquipe: { select: { id: true, nome: true } },
          contratoId: true,
          contrato: { select: { id: true, nome: true, numero: true } },
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });
      this.logger.log(
        `Sincronização de equipes retornou ${data.length} registros`
      );
      return data as unknown as EquipeSyncDto[];
    } catch (e) {
      handleCrudError(e, this.logger, 'sync', 'equipes');
    }
  }
}

/**
 * Serviço de sincronização de Eletricista para mobile: checksum, incremental (since)
 * e payload de eletricistas. Respeita filtro por contratos (allowedContractIds).
 */

import { ORDER_CONFIG } from '@common/constants/eletricista';
import { handleCrudError } from '@common/utils/error-handler';
import { computeSyncChecksum } from '@common/utils/sync-checksum';
import { buildSyncWhereIncremental } from '@common/utils/sync-where';
import { DatabaseService } from '@database/database.service';
import { Injectable, Logger } from '@nestjs/common';

import { EletricistaSyncDto } from '../dto';

@Injectable()
export class EletricistaSyncService {
  private readonly logger = new Logger(EletricistaSyncService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Aplica filtro de contratos ao where quando há allowedContractIds.
   * Se allowedContractIds é [] ou null, o chamador deve ter tratado (retorno vazio ou sem filtro).
   */
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
      return { eletricista: { count: 0, maxUpdatedAt: null } };
    }
    const where = this.buildSyncWhere(undefined, allowedContractIds);
    const a = await this.db.getPrisma().eletricista.aggregate({
      where,
      _count: true,
      _max: { updatedAt: true },
    });
    const iso = (d: Date | null) => d?.toISOString() ?? null;
    return {
      eletricista: { count: a._count, maxUpdatedAt: iso(a._max.updatedAt) },
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
    this.logger.log(
      'Calculando status de sincronização Eletricista (checksum)'
    );
    const payload = await this.buildSyncChecksumPayload(ids);
    const checksum = computeSyncChecksum(payload);
    const serverTime = new Date().toISOString();
    const changed = clientChecksum === undefined || clientChecksum !== checksum;
    this.logger.log(
      `Status Eletricista: checksum=${checksum.slice(0, 16)}..., changed=${changed}`
    );
    return { changed, checksum, serverTime };
  }

  async findAllForSync(
    since: string | undefined,
    allowedContractIds?: number[] | null
  ): Promise<EletricistaSyncDto[]> {
    const ids = allowedContractIds ?? null;
    if (ids && ids.length === 0) {
      this.logger.log('Nenhum contrato permitido, retornando lista vazia');
      return [];
    }
    this.logger.log(
      since
        ? `Sincronizando eletricistas - incremental since=${since}`
        : 'Sincronizando eletricistas - retorno completo'
    );
    try {
      const where = this.buildSyncWhere(since, ids);
      const data = await this.db.getPrisma().eletricista.findMany({
        where,
        orderBy: ORDER_CONFIG.SYNC_ORDER,
        select: {
          id: true,
          nome: true,
          matricula: true,
          telefone: true,
          estado: true,
          admissao: true,
          cargoId: true,
          cargo: { select: { id: true, nome: true } },
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
        `Sincronização de eletricistas retornou ${data.length} registros`
      );
      return data as unknown as EletricistaSyncDto[];
    } catch (e) {
      handleCrudError(e, this.logger, 'sync', 'eletricistas');
    }
  }
}

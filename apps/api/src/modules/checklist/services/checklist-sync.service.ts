/**
 * Serviço de sincronização de Checklist para mobile: checksum, incremental (since) e os 7 payloads.
 */

import {
  CHECKLIST_ORDER_CONFIG_COMPAT,
  ORDER_CONFIG,
} from '@common/constants/checklist';
import { handleCrudError } from '@common/utils/error-handler';
import { computeSyncChecksum } from '@common/utils/sync-checksum';
import { buildSyncWhereIncremental } from '@common/utils/sync-where';
import { DatabaseService } from '@database/database.service';
import { Injectable, Logger } from '@nestjs/common';

import {
  ChecklistOpcaoRespostaRelacaoSyncDto,
  ChecklistOpcaoRespostaSyncDto,
  ChecklistPerguntaRelacaoSyncDto,
  ChecklistPerguntaSyncDto,
  ChecklistResponseDto,
  ChecklistTipoEquipeRelacaoSyncDto,
  ChecklistTipoVeiculoRelacaoSyncDto,
} from '../dto';

@Injectable()
export class ChecklistSyncService {
  private readonly logger = new Logger(ChecklistSyncService.name);

  constructor(private readonly db: DatabaseService) {}

  private async fetchChecklistChecksumAggregates() {
    const w = { deletedAt: null };
    const prisma = this.db.getPrisma();
    return Promise.all([
      prisma.checklist.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
      prisma.checklistPergunta.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
      prisma.checklistPerguntaRelacao.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
      prisma.checklistOpcaoResposta.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
      prisma.checklistOpcaoRespostaRelacao.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
      prisma.checklistTipoVeiculoRelacao.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
      prisma.checklistTipoEquipeRelacao.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
    ]);
  }

  private async buildSyncChecksumPayload(): Promise<
    Record<string, { count: number; maxUpdatedAt: string | null }>
  > {
    const [
      checklist,
      checklistPergunta,
      checklistPerguntaRelacao,
      checklistOpcaoResposta,
      checklistOpcaoRespostaRelacao,
      checklistTipoVeiculoRelacao,
      checklistTipoEquipeRelacao,
    ] = await this.fetchChecklistChecksumAggregates();
    const iso = (d: Date | null) => d?.toISOString() ?? null;
    return {
      checklist: {
        count: checklist._count,
        maxUpdatedAt: iso(checklist._max.updatedAt),
      },
      checklistPergunta: {
        count: checklistPergunta._count,
        maxUpdatedAt: iso(checklistPergunta._max.updatedAt),
      },
      checklistPerguntaRelacao: {
        count: checklistPerguntaRelacao._count,
        maxUpdatedAt: iso(checklistPerguntaRelacao._max.updatedAt),
      },
      checklistOpcaoResposta: {
        count: checklistOpcaoResposta._count,
        maxUpdatedAt: iso(checklistOpcaoResposta._max.updatedAt),
      },
      checklistOpcaoRespostaRelacao: {
        count: checklistOpcaoRespostaRelacao._count,
        maxUpdatedAt: iso(checklistOpcaoRespostaRelacao._max.updatedAt),
      },
      checklistTipoVeiculoRelacao: {
        count: checklistTipoVeiculoRelacao._count,
        maxUpdatedAt: iso(checklistTipoVeiculoRelacao._max.updatedAt),
      },
      checklistTipoEquipeRelacao: {
        count: checklistTipoEquipeRelacao._count,
        maxUpdatedAt: iso(checklistTipoEquipeRelacao._max.updatedAt),
      },
    };
  }

  async getSyncStatus(
    clientChecksum?: string
  ): Promise<{ changed: boolean; checksum: string; serverTime: string }> {
    this.logger.log('Calculando status de sincronização Checklist (checksum)');
    const payload = await this.buildSyncChecksumPayload();
    const checksum = computeSyncChecksum(payload);
    const serverTime = new Date().toISOString();
    const changed = clientChecksum === undefined || clientChecksum !== checksum;
    this.logger.log(
      `Status Checklist: checksum=${checksum.slice(0, 16)}..., changed=${changed}`
    );
    return { changed, checksum, serverTime };
  }

  async findAllForSync(since?: string): Promise<ChecklistResponseDto[]> {
    this.logger.log(
      since
        ? `Sincronizando checklists - incremental since=${since}`
        : 'Sincronizando checklists - retorno completo'
    );
    try {
      const data = await this.db.getPrisma().checklist.findMany({
        where: buildSyncWhereIncremental(since),
        orderBy: ORDER_CONFIG.SYNC_ORDER,
        select: {
          id: true,
          nome: true,
          tipoChecklistId: true,
          tipoChecklist: { select: { id: true, nome: true } },
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });
      this.logger.log(
        `Sincronização de checklists retornou ${data.length} registros`
      );
      return data as ChecklistResponseDto[];
    } catch (e) {
      handleCrudError(e, this.logger, 'sync', 'checklists');
    }
  }

  async findAllPerguntasForSync(
    since?: string
  ): Promise<ChecklistPerguntaSyncDto[]> {
    this.logger.log(
      since
        ? `Sincronizando perguntas de checklist - incremental since=${since}`
        : 'Sincronizando perguntas de checklist'
    );
    try {
      const data = await this.db.getPrisma().checklistPergunta.findMany({
        where: buildSyncWhereIncremental(since),
        orderBy: ORDER_CONFIG.SYNC_ORDER,
        select: {
          id: true,
          nome: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });
      this.logger.log(
        `Sincronização de perguntas retornou ${data.length} registros`
      );
      return data as ChecklistPerguntaSyncDto[];
    } catch (e) {
      handleCrudError(e, this.logger, 'sync', 'perguntas de checklist');
    }
  }

  async findAllPerguntaRelacoesForSync(
    since?: string
  ): Promise<ChecklistPerguntaRelacaoSyncDto[]> {
    this.logger.log(
      since
        ? `Sincronizando relações Checklist-Perguntas - incremental since=${since}`
        : 'Sincronizando relações Checklist-Perguntas'
    );
    try {
      const data = await this.db.getPrisma().checklistPerguntaRelacao.findMany({
        where: buildSyncWhereIncremental(since),
        orderBy: CHECKLIST_ORDER_CONFIG_COMPAT.PERGUNTA_RELACAO_ORDER,
        select: {
          id: true,
          checklistId: true,
          checklistPerguntaId: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });
      this.logger.log(
        `Sincronização de relações Checklist-Perguntas retornou ${data.length} registros`
      );
      return data as ChecklistPerguntaRelacaoSyncDto[];
    } catch (e) {
      handleCrudError(e, this.logger, 'sync', 'relações Checklist-Perguntas');
    }
  }

  async findAllOpcoesForSync(
    since?: string
  ): Promise<ChecklistOpcaoRespostaSyncDto[]> {
    this.logger.log(
      since
        ? `Sincronizando opções de resposta de checklist - incremental since=${since}`
        : 'Sincronizando opções de resposta de checklist'
    );
    try {
      const data = await this.db.getPrisma().checklistOpcaoResposta.findMany({
        where: buildSyncWhereIncremental(since),
        orderBy: ORDER_CONFIG.SYNC_ORDER,
        select: {
          id: true,
          nome: true,
          geraPendencia: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });
      this.logger.log(
        `Sincronização de opções de resposta retornou ${data.length} registros`
      );
      return data as ChecklistOpcaoRespostaSyncDto[];
    } catch (e) {
      handleCrudError(
        e,
        this.logger,
        'sync',
        'opções de resposta de checklist'
      );
    }
  }

  async findAllOpcaoRelacoesForSync(
    since?: string
  ): Promise<ChecklistOpcaoRespostaRelacaoSyncDto[]> {
    this.logger.log(
      since
        ? `Sincronizando relações Checklist-Opções - incremental since=${since}`
        : 'Sincronizando relações Checklist-Opções de resposta'
    );
    try {
      const data = await this.db
        .getPrisma()
        .checklistOpcaoRespostaRelacao.findMany({
          where: buildSyncWhereIncremental(since),
          orderBy: CHECKLIST_ORDER_CONFIG_COMPAT.OPCAO_RELACAO_ORDER,
          select: {
            id: true,
            checklistId: true,
            checklistOpcaoRespostaId: true,
            createdAt: true,
            createdBy: true,
            updatedAt: true,
            updatedBy: true,
            deletedAt: true,
            deletedBy: true,
          },
        });
      this.logger.log(
        `Sincronização de relações Checklist-Opções retornou ${data.length} registros`
      );
      return data as ChecklistOpcaoRespostaRelacaoSyncDto[];
    } catch (e) {
      handleCrudError(
        e,
        this.logger,
        'sync',
        'relações Checklist-Opções de resposta'
      );
    }
  }

  async findAllTipoVeiculoRelacoesForSync(
    since?: string
  ): Promise<ChecklistTipoVeiculoRelacaoSyncDto[]> {
    this.logger.log(
      since
        ? `Sincronizando relações Checklist-Tipo de Veículo - incremental since=${since}`
        : 'Sincronizando relações Checklist-Tipo de Veículo'
    );
    try {
      const data = await this.db
        .getPrisma()
        .checklistTipoVeiculoRelacao.findMany({
          where: buildSyncWhereIncremental(since),
          orderBy: CHECKLIST_ORDER_CONFIG_COMPAT.TIPO_VEICULO_RELACAO_ORDER,
          select: {
            id: true,
            checklistId: true,
            tipoVeiculoId: true,
            createdAt: true,
            createdBy: true,
            updatedAt: true,
            updatedBy: true,
            deletedAt: true,
            deletedBy: true,
          },
        });
      this.logger.log(
        `Sincronização de relações Checklist-Tipo de Veículo retornou ${data.length} registros`
      );
      return data as ChecklistTipoVeiculoRelacaoSyncDto[];
    } catch (e) {
      handleCrudError(
        e,
        this.logger,
        'sync',
        'relações Checklist-Tipo de Veículo'
      );
    }
  }

  async findAllTipoEquipeRelacoesForSync(
    since?: string
  ): Promise<ChecklistTipoEquipeRelacaoSyncDto[]> {
    this.logger.log(
      since
        ? `Sincronizando relações Checklist-Tipo de Equipe - incremental since=${since}`
        : 'Sincronizando relações Checklist-Tipo de Equipe'
    );
    try {
      const data = await this.db
        .getPrisma()
        .checklistTipoEquipeRelacao.findMany({
          where: buildSyncWhereIncremental(since),
          orderBy: CHECKLIST_ORDER_CONFIG_COMPAT.TIPO_EQUIPE_RELACAO_ORDER,
          select: {
            id: true,
            checklistId: true,
            tipoEquipeId: true,
            tipoChecklistId: true,
            createdAt: true,
            createdBy: true,
            updatedAt: true,
            updatedBy: true,
            deletedAt: true,
            deletedBy: true,
          },
        });
      this.logger.log(
        `Sincronização de relações Checklist-Tipo de Equipe retornou ${data.length} registros`
      );
      return data as ChecklistTipoEquipeRelacaoSyncDto[];
    } catch (e) {
      handleCrudError(
        e,
        this.logger,
        'sync',
        'relações Checklist-Tipo de Equipe'
      );
    }
  }
}

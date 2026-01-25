/**
 * Serviço de sincronização APR para mobile: checksum, incremental (since) e os 6 payloads.
 */

import { APR_ORDER_CONFIG_COMPAT } from '@common/constants/apr';
import { handleCrudError } from '@common/utils/error-handler';
import { normalizeSyncAggregate } from '@common/utils/sync-aggregate';
import { buildSyncStatusResponse } from '@common/utils/sync-status';
import { buildSyncWhereIncremental } from '@common/utils/sync-where';
import { SyncStatusResponseDto } from '@common/dto/sync-status.dto';
import { DatabaseService } from '@database/database.service';
import { Injectable, Logger } from '@nestjs/common';

import {
  AprOpcaoRespostaRelacaoSyncDto,
  AprOpcaoRespostaSyncDto,
  AprPerguntaRelacaoSyncDto,
  AprPerguntaSyncDto,
  AprResponseDto,
  AprTipoAtividadeRelacaoSyncDto,
} from '../dto';

@Injectable()
export class AprSyncService {
  private readonly logger = new Logger(AprSyncService.name);

  constructor(private readonly db: DatabaseService) {}

  private async buildSyncChecksumPayload(): Promise<
    Record<string, { count: number; maxUpdatedAt: string | null }>
  > {
    const w = { deletedAt: null };
    const prisma = this.db.getPrisma();
    const [
      apr,
      aprPergunta,
      aprPerguntaRelacao,
      aprOpcaoResposta,
      aprOpcaoRespostaRelacao,
      aprTipoAtividadeRelacao,
    ] = await Promise.all([
      prisma.apr.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
      prisma.aprPergunta.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
      prisma.aprPerguntaRelacao.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
      prisma.aprOpcaoResposta.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
      prisma.aprOpcaoRespostaRelacao.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
      prisma.aprTipoAtividadeRelacao.aggregate({
        where: w,
        _count: true,
        _max: { updatedAt: true },
      }),
    ]);
    return {
      apr: normalizeSyncAggregate(apr),
      aprPergunta: normalizeSyncAggregate(aprPergunta),
      aprPerguntaRelacao: normalizeSyncAggregate(aprPerguntaRelacao),
      aprOpcaoResposta: normalizeSyncAggregate(aprOpcaoResposta),
      aprOpcaoRespostaRelacao: normalizeSyncAggregate(aprOpcaoRespostaRelacao),
      aprTipoAtividadeRelacao: normalizeSyncAggregate(aprTipoAtividadeRelacao),
    };
  }

  async getSyncStatus(
    clientChecksum?: string
  ): Promise<SyncStatusResponseDto> {
    this.logger.log('Calculando status de sincronização APR (checksum)');
    const payload = await this.buildSyncChecksumPayload();
    const result = buildSyncStatusResponse(payload, clientChecksum);
    this.logger.log(
      `Status APR: checksum=${result.checksum.slice(0, 16)}..., changed=${result.changed}`
    );
    return result;
  }

  async findAllForSync(since?: string): Promise<AprResponseDto[]> {
    this.logger.log(
      since
        ? `Sincronizando modelos APR - incremental since=${since}`
        : 'Sincronizando modelos APR - retorno completo'
    );
    try {
      const data = await this.db.getPrisma().apr.findMany({
        where: buildSyncWhereIncremental(since),
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
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
        `Sincronização de modelos APR retornou ${data.length} registros`
      );
      return data as AprResponseDto[];
    } catch (e) {
      handleCrudError(e, this.logger, 'sync', 'modelos APR');
    }
  }

  async findAllPerguntasForSync(since?: string): Promise<AprPerguntaSyncDto[]> {
    this.logger.log(
      since
        ? `Sincronizando perguntas APR - incremental since=${since}`
        : 'Sincronizando perguntas APR - retorno completo'
    );
    try {
      const data = await this.db.getPrisma().aprPergunta.findMany({
        where: buildSyncWhereIncremental(since),
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
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
        `Sincronização de perguntas APR retornou ${data.length} registros`
      );
      return data as AprPerguntaSyncDto[];
    } catch (e) {
      handleCrudError(e, this.logger, 'sync', 'perguntas APR');
    }
  }

  async findAllPerguntaRelacoesForSync(
    since?: string
  ): Promise<AprPerguntaRelacaoSyncDto[]> {
    this.logger.log(
      since
        ? `Sincronizando relações APR-Perguntas - incremental since=${since}`
        : 'Sincronizando relações APR-Perguntas - retorno completo'
    );
    try {
      const data = await this.db.getPrisma().aprPerguntaRelacao.findMany({
        where: buildSyncWhereIncremental(since),
        orderBy: APR_ORDER_CONFIG_COMPAT.PERGUNTA_RELACAO_ORDER,
        select: {
          id: true,
          aprId: true,
          aprPerguntaId: true,
          ordem: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });
      this.logger.log(
        `Sincronização de relações APR-Perguntas retornou ${data.length} registros`
      );
      return data as AprPerguntaRelacaoSyncDto[];
    } catch (e) {
      handleCrudError(e, this.logger, 'sync', 'relações APR-Perguntas');
    }
  }

  async findAllOpcoesForSync(
    since?: string
  ): Promise<AprOpcaoRespostaSyncDto[]> {
    this.logger.log(
      since
        ? `Sincronizando opções de resposta APR - incremental since=${since}`
        : 'Sincronizando opções de resposta APR - retorno completo'
    );
    try {
      const data = await this.db.getPrisma().aprOpcaoResposta.findMany({
        where: buildSyncWhereIncremental(since),
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
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
        `Sincronização de opções de resposta APR retornou ${data.length} registros`
      );
      return data as AprOpcaoRespostaSyncDto[];
    } catch (e) {
      handleCrudError(e, this.logger, 'sync', 'opções de resposta APR');
    }
  }

  async findAllOpcaoRelacoesForSync(
    since?: string
  ): Promise<AprOpcaoRespostaRelacaoSyncDto[]> {
    this.logger.log(
      since
        ? `Sincronizando relações APR-Opções - incremental since=${since}`
        : 'Sincronizando relações APR-Opções de resposta'
    );
    try {
      const data = await this.db.getPrisma().aprOpcaoRespostaRelacao.findMany({
        where: buildSyncWhereIncremental(since),
        orderBy: APR_ORDER_CONFIG_COMPAT.OPCAO_RELACAO_ORDER,
        select: {
          id: true,
          aprId: true,
          aprOpcaoRespostaId: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });
      this.logger.log(
        `Sincronização de relações APR-Opções retornou ${data.length} registros`
      );
      return data as AprOpcaoRespostaRelacaoSyncDto[];
    } catch (e) {
      handleCrudError(e, this.logger, 'sync', 'relações APR-Opções');
    }
  }

  async findAllTipoAtividadeRelacoesForSync(
    since?: string
  ): Promise<AprTipoAtividadeRelacaoSyncDto[]> {
    this.logger.log(
      since
        ? `Sincronizando relações APR-TipoAtividade - incremental since=${since}`
        : 'Sincronizando relações APR-Tipo de Atividade'
    );
    try {
      const data = await this.db.getPrisma().aprTipoAtividadeRelacao.findMany({
        where: buildSyncWhereIncremental(since),
        orderBy: APR_ORDER_CONFIG_COMPAT.TIPO_ATIVIDADE_RELACAO_ORDER,
        select: {
          id: true,
          aprId: true,
          tipoAtividadeId: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });
      this.logger.log(
        `Sincronização de relações APR-Tipo de Atividade retornou ${data.length} registros`
      );
      return data as AprTipoAtividadeRelacaoSyncDto[];
    } catch (e) {
      handleCrudError(e, this.logger, 'sync', 'relações APR-Tipo de Atividade');
    }
  }
}

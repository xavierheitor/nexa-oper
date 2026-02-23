import { Injectable } from '@nestjs/common';
import { AppError } from '../../../core/errors/app-error';
import { AppLogger } from '../../../core/logger/app-logger';
import { PrismaService } from '../../../database/prisma.service';
import {
  EvidenceHandler,
  EvidenceContext,
  UploadResult,
} from './evidence.handler';

@Injectable()
export class ChecklistReprovaEvidenceHandler implements EvidenceHandler {
  readonly type = 'checklist-reprova';

  metadataSpec = {
    required: ['turnoId', 'checklistPerguntaId'],
    optional: [],
    description:
      'Vincula foto à reprova específica de um checklist. entityId = checklistPreenchidoId ou checklistUuid.',
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  validate(ctx: EvidenceContext): Promise<void> {
    if (!ctx.entityId) {
      throw AppError.validation(
        'entityId (checklistPreenchidoId ou checklistUuid) obrigatório',
      );
    }
    const { turnoId, checklistPerguntaId } = ctx.metadata ?? {};
    if (turnoId == null || checklistPerguntaId == null) {
      throw AppError.validation(
        'turnoId e checklistPerguntaId obrigatórios para vincular a foto à reprova específica',
      );
    }
    return Promise.resolve();
  }

  buildStoragePath(ctx: EvidenceContext, filename: string) {
    const id = ctx.entityId.replace(/[/\\]/g, '-');
    return `checklists/${id}/reprovas/${Date.now()}-${filename}`;
  }

  async persist(ctx: EvidenceContext, upload: UploadResult) {
    const { turnoId, checklistPerguntaId } = (ctx.metadata ?? {}) as {
      turnoId?: number;
      checklistPerguntaId?: number;
    };

    // 1) Registro em UploadEvidence (auditoria)
    await this.prisma.uploadEvidence.create({
      data: {
        tipo: this.type,
        entityType: ctx.entityType || 'checklistPreenchido',
        entityId: String(ctx.entityId),
        url: upload.url,
        path: upload.path,
        tamanho: upload.size,
        mimeType: upload.mimeType,
        nomeArquivo: upload.filename,
      },
    });

    // 2) Vincular à resposta/pendência específica (ChecklistRespostaFoto)
    if (turnoId == null || checklistPerguntaId == null) return;

    const checklistPreenchido = await this.buscarChecklistPreenchido(
      ctx.entityId,
      turnoId,
    );
    if (!checklistPreenchido) {
      this.logger.warn(
        'Checklist preenchido não encontrado. Foto salva em UploadEvidence, mas sem vínculo.',
        { entityId: ctx.entityId, turnoId },
      );
      return;
    }

    const resposta = await this.prisma.checklistResposta.findFirst({
      where: {
        checklistPreenchidoId: checklistPreenchido.id,
        perguntaId: checklistPerguntaId,
        deletedAt: null,
      },
      include: { ChecklistPendencia: true },
    });

    if (!resposta) {
      this.logger.warn(
        'Resposta não encontrada. Foto salva em UploadEvidence, mas sem vínculo.',
        {
          checklistPreenchidoId: checklistPreenchido.id,
          perguntaId: checklistPerguntaId,
        },
      );
      return;
    }

    const pendencia = await this.obterOuCriarPendencia(
      resposta,
      checklistPreenchido.turnoId,
    );
    if (!pendencia) return;

    await this.prisma.checklistRespostaFoto.create({
      data: {
        checklistRespostaId: resposta.id,
        checklistPendenciaId: pendencia.id,
        caminhoArquivo: upload.path,
        urlPublica: upload.url,
        tamanhoBytes: BigInt(upload.size),
        mimeType: upload.mimeType ?? 'application/octet-stream',
        sincronizadoEm: new Date(),
        metadados: {
          uploadEvidence: true,
          entityId: ctx.entityId,
          turnoId,
          perguntaId: checklistPerguntaId,
        },
        createdBy: 'system',
      },
    });

    await this.prisma.checklistResposta.update({
      where: { id: resposta.id },
      data: {
        fotosSincronizadas: { increment: 1 },
        aguardandoFoto: false,
        updatedBy: 'system',
      },
    });

    this.logger.debug('Foto vinculada', {
      checklistRespostaId: resposta.id,
      checklistPendenciaId: pendencia.id,
    });
  }

  private async buscarChecklistPreenchido(entityId: string, turnoId: number) {
    const isUuid = entityId.includes('-') && entityId.length >= 36;
    if (isUuid) {
      return this.prisma.checklistPreenchido.findFirst({
        where: { uuid: entityId, turnoId, deletedAt: null },
      });
    }
    const id = parseInt(entityId, 10);
    if (Number.isNaN(id)) return null;
    return this.prisma.checklistPreenchido.findFirst({
      where: { id, turnoId, deletedAt: null },
    });
  }

  private async obterOuCriarPendencia(
    resposta: {
      id: number;
      checklistPreenchidoId: number;
      ChecklistPendencia: { id: number } | null;
    },
    turnoId: number,
  ): Promise<{ id: number } | null> {
    if (resposta.ChecklistPendencia) return resposta.ChecklistPendencia;

    try {
      return await this.prisma.checklistPendencia.create({
        data: {
          checklistRespostaId: resposta.id,
          checklistPreenchidoId: resposta.checklistPreenchidoId,
          turnoId,
          status: 'AGUARDANDO_TRATAMENTO',
          createdBy: 'system',
        },
      });
    } catch (err: unknown) {
      const e = err as { code?: string; meta?: { target?: string[] } };
      if (
        e?.code === 'P2002' &&
        e?.meta?.target?.includes('checklistRespostaId')
      ) {
        const pend = await this.prisma.checklistPendencia.findUnique({
          where: { checklistRespostaId: resposta.id },
        });
        return pend;
      }
      this.logger.error('Erro ao criar pendência para resposta', e, {
        respostaId: resposta.id,
      });
      throw err;
    }
  }
}

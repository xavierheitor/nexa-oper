import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import { AppError } from '../../../core/errors/app-error';
import { AppLogger } from '../../../core/logger/app-logger';
import { PrismaService } from '../../../database/prisma.service';
import {
  EvidenceHandler,
  EvidenceContext,
  UploadFingerprint,
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

  private parseMetadata(ctx: EvidenceContext): {
    turnoId: number;
    checklistPerguntaId: number;
  } | null {
    const { turnoId, checklistPerguntaId } = (ctx.metadata ?? {}) as {
      turnoId?: number;
      checklistPerguntaId?: number;
    };
    if (turnoId == null || checklistPerguntaId == null) return null;
    return {
      turnoId: Number(turnoId),
      checklistPerguntaId: Number(checklistPerguntaId),
    };
  }

  private mapChecklistFotoToUploadResult(photo: {
    caminhoArquivo: string;
    urlPublica: string | null;
    tamanhoBytes: bigint;
    mimeType: string;
  }): UploadResult {
    const normalizedPath = String(photo.caminhoArquivo).replace(/^[/\\]+/, '');
    return {
      path: normalizedPath,
      url:
        photo.urlPublica ?? `/uploads/${normalizedPath.replace(/[\\]+/g, '/')}`,
      size: Number(photo.tamanhoBytes),
      mimeType: photo.mimeType,
      filename: path.basename(normalizedPath),
    };
  }

  private async findExistingChecklistFoto(
    checklistRespostaId: number,
    checksum: string,
  ): Promise<UploadResult | null> {
    const existing = await this.prisma.checklistRespostaFoto.findFirst({
      where: {
        checklistRespostaId,
        checksum,
        deletedAt: null,
      },
      select: {
        caminhoArquivo: true,
        urlPublica: true,
        tamanhoBytes: true,
        mimeType: true,
      },
    });
    if (!existing) return null;
    return this.mapChecklistFotoToUploadResult(existing);
  }

  private buildEvidenceIdempotencyKey(
    ctx: EvidenceContext,
    checklistRespostaId: number,
    fingerprint: UploadFingerprint,
  ): string {
    return `${this.type}:${ctx.entityType || 'checklistPreenchido'}:${ctx.entityId}:${checklistRespostaId}:${fingerprint.checksum}`;
  }

  async findExisting(
    ctx: EvidenceContext,
    fingerprint: UploadFingerprint,
  ): Promise<UploadResult | null> {
    const meta = this.parseMetadata(ctx);
    if (!meta) return null;

    const checklistPreenchido = await this.buscarChecklistPreenchido(
      ctx.entityId,
      meta.turnoId,
    );
    if (!checklistPreenchido) return null;

    const resposta = await this.prisma.checklistResposta.findFirst({
      where: {
        checklistPreenchidoId: checklistPreenchido.id,
        perguntaId: meta.checklistPerguntaId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!resposta) return null;

    return this.findExistingChecklistFoto(resposta.id, fingerprint.checksum);
  }

  async persist(
    ctx: EvidenceContext,
    upload: UploadResult,
    fingerprint?: UploadFingerprint,
  ): Promise<UploadResult> {
    const meta = this.parseMetadata(ctx);
    if (!meta) return upload;

    const checklistPreenchido = await this.buscarChecklistPreenchido(
      ctx.entityId,
      meta.turnoId,
    );
    if (!checklistPreenchido) {
      this.logger.warn(
        'Checklist preenchido não encontrado. Foto salva em UploadEvidence, mas sem vínculo.',
        { entityId: ctx.entityId, turnoId: meta.turnoId },
      );
      return upload;
    }

    const resposta = await this.prisma.checklistResposta.findFirst({
      where: {
        checklistPreenchidoId: checklistPreenchido.id,
        perguntaId: meta.checklistPerguntaId,
        deletedAt: null,
      },
      include: { ChecklistPendencia: true },
    });

    if (!resposta) {
      this.logger.warn(
        'Resposta não encontrada. Foto salva em UploadEvidence, mas sem vínculo.',
        {
          checklistPreenchidoId: checklistPreenchido.id,
          perguntaId: meta.checklistPerguntaId,
        },
      );
      return upload;
    }

    const idempotencyKey = fingerprint
      ? this.buildEvidenceIdempotencyKey(ctx, resposta.id, fingerprint)
      : null;

    const persistEvidence = async (result: UploadResult): Promise<void> => {
      if (fingerprint && idempotencyKey) {
        await this.prisma.uploadEvidence.upsert({
          where: { idempotencyKey },
          create: {
            tipo: this.type,
            entityType: ctx.entityType || 'checklistPreenchido',
            entityId: String(ctx.entityId),
            url: result.url,
            path: result.path,
            tamanho: result.size,
            mimeType: result.mimeType,
            nomeArquivo: result.filename,
            checksum: fingerprint.checksum,
            idempotencyKey,
            createdBy: 'system',
          },
          update: {
            url: result.url,
            path: result.path,
            tamanho: result.size,
            mimeType: result.mimeType,
            nomeArquivo: result.filename,
            checksum: fingerprint.checksum,
          },
        });
        return;
      }

      await this.prisma.uploadEvidence.create({
        data: {
          tipo: this.type,
          entityType: ctx.entityType || 'checklistPreenchido',
          entityId: String(ctx.entityId),
          url: result.url,
          path: result.path,
          tamanho: result.size,
          mimeType: result.mimeType,
          nomeArquivo: result.filename,
          checksum: fingerprint?.checksum,
          createdBy: 'system',
        },
      });
    };

    if (fingerprint) {
      const existing = await this.findExistingChecklistFoto(
        resposta.id,
        fingerprint.checksum,
      );
      if (existing) {
        this.logger.debug('Upload checklist-reprova duplicado detectado', {
          checklistRespostaId: resposta.id,
          checksum: fingerprint.checksum,
        });
        await persistEvidence(existing);
        return existing;
      }
    }

    const pendencia = await this.obterOuCriarPendencia(
      resposta,
      checklistPreenchido.turnoId,
    );
    if (!pendencia) {
      await persistEvidence(upload);
      return upload;
    }

    let finalResult = upload;
    try {
      await this.prisma.checklistRespostaFoto.create({
        data: {
          checklistRespostaId: resposta.id,
          checklistPendenciaId: pendencia.id,
          caminhoArquivo: upload.path,
          urlPublica: upload.url,
          tamanhoBytes: BigInt(upload.size),
          mimeType: upload.mimeType ?? 'application/octet-stream',
          checksum: fingerprint?.checksum,
          sincronizadoEm: new Date(),
          metadados: {
            uploadEvidence: true,
            entityId: ctx.entityId,
            turnoId: meta.turnoId,
            perguntaId: meta.checklistPerguntaId,
            checksum: fingerprint?.checksum,
          },
          createdBy: 'system',
        },
      });
    } catch (error: unknown) {
      const e = error as { code?: string };
      if (e.code === 'P2002' && fingerprint) {
        const existing = await this.findExistingChecklistFoto(
          resposta.id,
          fingerprint.checksum,
        );
        if (existing) {
          finalResult = existing;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    if (finalResult.path === upload.path) {
      await this.prisma.checklistResposta.update({
        where: { id: resposta.id },
        data: {
          fotosSincronizadas: { increment: 1 },
          aguardandoFoto: false,
          updatedBy: 'system',
        },
      });
    }

    await persistEvidence(finalResult);

    this.logger.debug('Foto vinculada', {
      checklistRespostaId: resposta.id,
      checklistPendenciaId: pendencia.id,
      path: finalResult.path,
    });

    return finalResult;
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

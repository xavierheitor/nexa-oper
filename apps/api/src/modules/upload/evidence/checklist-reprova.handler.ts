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
import { CANONICAL_PHOTO_METADATA_OPTIONAL_FIELDS } from './common-metadata-spec';
import { UploadEvidenceLinkService } from './upload-evidence-link.service';

@Injectable()
export class ChecklistReprovaEvidenceHandler implements EvidenceHandler {
  readonly type = 'checklist-reprova';

  metadataSpec = {
    required: ['turnoId'],
    optional: [
      'checklistPerguntaId',
      'checklistRespostaId',
      'checklistPreenchidoId',
      ...CANONICAL_PHOTO_METADATA_OPTIONAL_FIELDS,
    ],
    description:
      'Vincula foto à reprova específica de um checklist. entityId = checklistPreenchidoId ou checklistUuid. Requer turnoId e checklistPerguntaId ou checklistRespostaId.',
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly linkService: UploadEvidenceLinkService,
  ) {}

  validate(ctx: EvidenceContext): Promise<void> {
    if (!ctx.entityId) {
      throw AppError.validation(
        'entityId (checklistPreenchidoId ou checklistUuid) obrigatório',
      );
    }
    const { turnoId, checklistPerguntaId, checklistRespostaId } =
      ctx.metadata ?? {};
    if (
      turnoId == null ||
      (checklistPerguntaId == null && checklistRespostaId == null)
    ) {
      throw AppError.validation(
        'turnoId e (checklistPerguntaId ou checklistRespostaId) são obrigatórios para vincular a foto à reprova específica',
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
    checklistPerguntaId: number | null;
    checklistRespostaId: number | null;
    checklistPreenchidoId: number | null;
  } | null {
    const {
      turnoId,
      checklistPerguntaId,
      checklistRespostaId,
      checklistPreenchidoId,
    } = (ctx.metadata ?? {}) as {
      turnoId?: number;
      checklistPerguntaId?: number;
      checklistRespostaId?: number;
      checklistPreenchidoId?: number;
    };
    if (turnoId == null) return null;

    const perguntaId = this.parseOptionalInt(checklistPerguntaId);
    const respostaId = this.parseOptionalInt(checklistRespostaId);
    const preenchidoId = this.parseOptionalInt(checklistPreenchidoId);

    if (perguntaId == null && respostaId == null) return null;

    return {
      turnoId: Number(turnoId),
      checklistPerguntaId: perguntaId,
      checklistRespostaId: respostaId,
      checklistPreenchidoId: preenchidoId,
    };
  }

  private parseOptionalInt(value: unknown): number | null {
    if (value == null) return null;
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    const parsed =
      typeof value === 'number'
        ? Math.trunc(value)
        : Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
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
    fingerprint: UploadFingerprint,
    checklistRespostaId?: number,
  ): string {
    const respostaScope =
      checklistRespostaId == null ? '' : `:${checklistRespostaId}`;
    return `${this.type}:${ctx.entityType || 'checklistPreenchido'}:${ctx.entityId}${respostaScope}:${fingerprint.checksum}`;
  }

  private async persistEvidenceRecord(params: {
    ctx: EvidenceContext;
    result: UploadResult;
    fingerprint?: UploadFingerprint;
    checklistRespostaId?: number;
  }): Promise<void> {
    const { ctx, result, fingerprint, checklistRespostaId } = params;
    const idempotencyKey = fingerprint
      ? this.buildEvidenceIdempotencyKey(ctx, fingerprint, checklistRespostaId)
      : null;

    let evidenceId: number;
    if (fingerprint && idempotencyKey) {
      const evidence = await this.prisma.uploadEvidence.upsert({
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
        select: { id: true },
      });
      evidenceId = evidence.id;
    } else {
      const evidence = await this.prisma.uploadEvidence.create({
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
        select: { id: true },
      });
      evidenceId = evidence.id;
    }

    await this.linkService.upsertFromEvidence({
      uploadEvidenceId: evidenceId,
      ctx,
      createdBy: 'system',
    });
  }

  private async marcarRespostaComoSincronizada(
    checklistRespostaId: number,
  ): Promise<void> {
    const totalFotos = await this.prisma.checklistRespostaFoto.count({
      where: {
        checklistRespostaId,
        deletedAt: null,
      },
    });
    await this.prisma.checklistResposta.update({
      where: { id: checklistRespostaId },
      data: {
        fotosSincronizadas: totalFotos,
        aguardandoFoto: false,
        updatedBy: 'system',
      },
    });
  }

  private async buscarResposta(
    checklistPreenchidoId: number,
    meta: {
      checklistPerguntaId: number | null;
      checklistRespostaId: number | null;
    },
  ): Promise<{
    id: number;
    checklistPreenchidoId: number;
    ChecklistPendencia: { id: number } | null;
  } | null> {
    if (meta.checklistRespostaId != null) {
      const byRespostaId = await this.prisma.checklistResposta.findFirst({
        where: {
          id: meta.checklistRespostaId,
          checklistPreenchidoId,
          deletedAt: null,
        },
        include: { ChecklistPendencia: true },
      });
      if (byRespostaId) return byRespostaId;
    }

    if (meta.checklistPerguntaId == null) return null;

    return this.prisma.checklistResposta.findFirst({
      where: {
        checklistPreenchidoId,
        perguntaId: meta.checklistPerguntaId,
        deletedAt: null,
      },
      include: { ChecklistPendencia: true },
    });
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
      meta.checklistPreenchidoId,
    );
    if (!checklistPreenchido) return null;

    const resposta = await this.buscarResposta(checklistPreenchido.id, meta);
    if (!resposta) return null;

    return this.findExistingChecklistFoto(resposta.id, fingerprint.checksum);
  }

  async persist(
    ctx: EvidenceContext,
    upload: UploadResult,
    fingerprint?: UploadFingerprint,
  ): Promise<UploadResult> {
    const meta = this.parseMetadata(ctx);
    if (!meta) {
      await this.persistEvidenceRecord({
        ctx,
        result: upload,
        fingerprint,
      });
      return upload;
    }

    const checklistPreenchido = await this.buscarChecklistPreenchido(
      ctx.entityId,
      meta.turnoId,
      meta.checklistPreenchidoId,
    );
    if (!checklistPreenchido) {
      this.logger.warn(
        'Checklist preenchido não encontrado. Foto salva em UploadEvidence, mas sem vínculo.',
        {
          entityId: ctx.entityId,
          turnoId: meta.turnoId,
          checklistPreenchidoId: meta.checklistPreenchidoId,
        },
      );
      await this.persistEvidenceRecord({
        ctx,
        result: upload,
        fingerprint,
      });
      return upload;
    }

    const resposta = await this.buscarResposta(checklistPreenchido.id, meta);

    if (!resposta) {
      this.logger.warn(
        'Resposta não encontrada. Foto salva em UploadEvidence, mas sem vínculo.',
        {
          checklistPreenchidoId: checklistPreenchido.id,
          perguntaId: meta.checklistPerguntaId,
          checklistRespostaId: meta.checklistRespostaId,
        },
      );
      await this.persistEvidenceRecord({
        ctx,
        result: upload,
        fingerprint,
      });
      return upload;
    }

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
        await this.marcarRespostaComoSincronizada(resposta.id);
        await this.persistEvidenceRecord({
          ctx,
          result: existing,
          fingerprint,
          checklistRespostaId: resposta.id,
        });
        return existing;
      }
    }

    const pendencia = await this.obterOuCriarPendencia(
      resposta,
      checklistPreenchido.turnoId,
    );
    if (!pendencia) {
      this.logger.warn(
        'Pendência de checklist não disponível; foto será vinculada sem checklistPendenciaId.',
        { checklistRespostaId: resposta.id },
      );
    }

    let finalResult = upload;
    try {
      await this.prisma.checklistRespostaFoto.create({
        data: {
          checklistRespostaId: resposta.id,
          checklistPendenciaId: pendencia?.id ?? null,
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
            checklistRespostaId: meta.checklistRespostaId,
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

    await this.marcarRespostaComoSincronizada(resposta.id);
    await this.persistEvidenceRecord({
      ctx,
      result: finalResult,
      fingerprint,
      checklistRespostaId: resposta.id,
    });

    this.logger.debug('Foto vinculada', {
      checklistRespostaId: resposta.id,
      checklistPendenciaId: pendencia?.id ?? null,
      path: finalResult.path,
    });

    return finalResult;
  }

  private async buscarChecklistPreenchido(
    entityId: string,
    turnoId: number,
    metadataChecklistPreenchidoId: number | null,
  ) {
    const normalizedEntityId = entityId.trim();
    const parsedId = Number.parseInt(normalizedEntityId, 10);

    if (Number.isFinite(parsedId) && parsedId > 0) {
      const byId = await this.prisma.checklistPreenchido.findFirst({
        where: { id: parsedId, turnoId, deletedAt: null },
      });
      if (byId) return byId;
    }

    const byUuid = await this.prisma.checklistPreenchido.findFirst({
      where: { uuid: normalizedEntityId, turnoId, deletedAt: null },
    });
    if (byUuid) return byUuid;

    if (metadataChecklistPreenchidoId != null) {
      return this.prisma.checklistPreenchido.findFirst({
        where: {
          id: metadataChecklistPreenchidoId,
          turnoId,
          deletedAt: null,
        },
      });
    }

    return null;
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

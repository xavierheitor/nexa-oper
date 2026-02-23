import { Injectable } from '@nestjs/common';
import { AppError } from '../../../core/errors/app-error';
import { PrismaService } from '../../../database/prisma.service';
import type {
  EvidenceHandler,
  EvidenceContext,
  UploadFingerprint,
  UploadResult,
} from './evidence.handler';

@Injectable()
export class ChecklistAssinaturaEvidenceHandler implements EvidenceHandler {
  readonly type = 'checklist-assinatura';

  metadataSpec = {
    required: ['turnoId', 'sequenciaAssinatura'],
    optional: [],
    description:
      'Assinatura capturada ao final do checklist. entityId = checklistPreenchidoId ou checklistUuid.',
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  validate(ctx: EvidenceContext): Promise<void> {
    if (!ctx.entityId) {
      throw AppError.validation(
        'entityId (checklistPreenchidoId ou checklistUuid) obrigatório',
      );
    }
    const { turnoId, sequenciaAssinatura } = ctx.metadata ?? {};
    if (turnoId == null || sequenciaAssinatura == null) {
      throw AppError.validation('turnoId e sequenciaAssinatura obrigatórios');
    }
    return Promise.resolve();
  }

  buildStoragePath(ctx: EvidenceContext, filename: string) {
    const id = String(ctx.entityId).replace(/[/\\]/g, '-');
    return `checklists/${id}/assinaturas/${Date.now()}-${filename}`;
  }

  private parseMetadata(ctx: EvidenceContext) {
    const { turnoId, sequenciaAssinatura } = ctx.metadata ?? {};
    if (turnoId == null || sequenciaAssinatura == null) {
      return null;
    }
    return {
      turnoId: Number(turnoId),
      sequenciaAssinatura: Number(sequenciaAssinatura),
    };
  }

  private buildIdempotencyKey(
    ctx: EvidenceContext,
    fingerprint: UploadFingerprint,
  ): string | null {
    const meta = this.parseMetadata(ctx);
    if (!meta) return null;
    return `${this.type}:${ctx.entityType ?? 'checklistPreenchido'}:${ctx.entityId}:${meta.turnoId}:${meta.sequenciaAssinatura}:${fingerprint.checksum}`;
  }

  async findExisting(
    ctx: EvidenceContext,
    fingerprint: UploadFingerprint,
  ): Promise<UploadResult | null> {
    const idempotencyKey = this.buildIdempotencyKey(ctx, fingerprint);
    if (!idempotencyKey) return null;

    const existing = await this.prisma.uploadEvidence.findUnique({
      where: { idempotencyKey },
      select: {
        url: true,
        path: true,
        tamanho: true,
        mimeType: true,
        nomeArquivo: true,
      },
    });

    if (!existing) return null;

    return {
      url: existing.url,
      path: existing.path,
      size: existing.tamanho,
      mimeType: existing.mimeType ?? undefined,
      filename: existing.nomeArquivo ?? undefined,
    };
  }

  async persist(
    ctx: EvidenceContext,
    upload: UploadResult,
    fingerprint?: UploadFingerprint,
  ): Promise<UploadResult> {
    if (!fingerprint) {
      await this.prisma.uploadEvidence.create({
        data: {
          tipo: this.type,
          entityType: ctx.entityType ?? 'checklistPreenchido',
          entityId: String(ctx.entityId),
          url: upload.url,
          path: upload.path,
          tamanho: upload.size,
          mimeType: upload.mimeType,
          nomeArquivo: upload.filename,
          createdBy: 'system',
        },
      });
      return upload;
    }

    const idempotencyKey = this.buildIdempotencyKey(ctx, fingerprint);
    if (!idempotencyKey) return upload;

    const evidence = await this.prisma.uploadEvidence.upsert({
      where: { idempotencyKey },
      create: {
        tipo: this.type,
        entityType: ctx.entityType ?? 'checklistPreenchido',
        entityId: String(ctx.entityId),
        url: upload.url,
        path: upload.path,
        tamanho: upload.size,
        mimeType: upload.mimeType,
        nomeArquivo: upload.filename,
        checksum: fingerprint.checksum,
        idempotencyKey,
        createdBy: 'system',
      },
      update: {},
      select: {
        url: true,
        path: true,
        tamanho: true,
        mimeType: true,
        nomeArquivo: true,
      },
    });

    return {
      url: evidence.url,
      path: evidence.path,
      size: evidence.tamanho,
      mimeType: evidence.mimeType ?? undefined,
      filename: evidence.nomeArquivo ?? undefined,
    };
  }
}

import { Injectable } from '@nestjs/common';

import { AppError } from '../../../core/errors/app-error';
import { PrismaService } from '../../../database/prisma.service';
import { normalizeStoredUploadResult } from '../storage/upload-url';

import { CANONICAL_PHOTO_METADATA_OPTIONAL_FIELDS } from './common-metadata-spec';
import type {
  EvidenceContext,
  EvidenceHandler,
  UploadFingerprint,
  UploadResult,
} from './evidence.handler';
import { UploadEvidenceLinkService } from './upload-evidence-link.service';

type PosteViabilizacaoTarget = {
  posteId: number;
  projetoId: number;
  viabilizacaoId: number;
};

@Injectable()
export class ProjetoViabilizacaoPosteEvidenceHandler
  implements EvidenceHandler
{
  readonly type = 'projeto-viabilizacao-poste';

  metadataSpec = {
    required: [],
    optional: [
      'viabilizacaoId',
      'latitude',
      'longitude',
      'observacao',
      ...CANONICAL_PHOTO_METADATA_OPTIONAL_FIELDS,
    ],
    description:
      'Foto de viabilização vinculada a um poste do projeto. entityId = projPosteId.',
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly linkService: UploadEvidenceLinkService,
  ) {}

  async validate(ctx: EvidenceContext): Promise<void> {
    await this.resolveTarget(ctx);
  }

  buildStoragePath(ctx: EvidenceContext, filename: string): string {
    const posteId = String(ctx.entityId).replaceAll(/[/\\]/g, '-');
    return `projetos/postes/${posteId}/viabilizacao/${Date.now()}-${filename}`;
  }

  async findExisting(
    ctx: EvidenceContext,
    fingerprint: UploadFingerprint,
  ): Promise<UploadResult | null> {
    const idempotencyKey = this.buildIdempotencyKey(ctx, fingerprint);
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

    if (!existing) {
      return null;
    }

    return normalizeStoredUploadResult({
      url: existing.url,
      path: existing.path,
      size: existing.tamanho,
      mimeType: existing.mimeType ?? undefined,
      filename: existing.nomeArquivo ?? undefined,
    });
  }

  async persist(
    ctx: EvidenceContext,
    upload: UploadResult,
    fingerprint?: UploadFingerprint,
  ): Promise<UploadResult> {
    const normalizedUpload = normalizeStoredUploadResult(upload);
    const target = await this.resolveTarget(ctx);
    const idempotencyKey = fingerprint
      ? this.buildIdempotencyKey(ctx, fingerprint)
      : null;

    const evidence = idempotencyKey
      ? await this.prisma.uploadEvidence.upsert({
          where: { idempotencyKey },
          create: {
            tipo: this.type,
            entityType: ctx.entityType ?? 'projPoste',
            entityId: String(target.posteId),
            url: normalizedUpload.url,
            path: normalizedUpload.path,
            tamanho: normalizedUpload.size,
            mimeType: normalizedUpload.mimeType,
            nomeArquivo: normalizedUpload.filename,
            checksum: fingerprint?.checksum,
            idempotencyKey,
            createdBy: 'system',
          },
          update: {
            url: normalizedUpload.url,
            path: normalizedUpload.path,
            tamanho: normalizedUpload.size,
            mimeType: normalizedUpload.mimeType,
            nomeArquivo: normalizedUpload.filename,
            checksum: fingerprint?.checksum,
          },
          select: {
            id: true,
            url: true,
            path: true,
            tamanho: true,
            mimeType: true,
            nomeArquivo: true,
          },
        })
      : await this.prisma.uploadEvidence.create({
          data: {
            tipo: this.type,
            entityType: ctx.entityType ?? 'projPoste',
            entityId: String(target.posteId),
            url: normalizedUpload.url,
            path: normalizedUpload.path,
            tamanho: normalizedUpload.size,
            mimeType: normalizedUpload.mimeType,
            nomeArquivo: normalizedUpload.filename,
            checksum: fingerprint?.checksum,
            createdBy: 'system',
          },
          select: {
            id: true,
            url: true,
            path: true,
            tamanho: true,
            mimeType: true,
            nomeArquivo: true,
          },
        });

    await this.linkService.upsertFromEvidence({
      uploadEvidenceId: evidence.id,
      ctx: {
        ...ctx,
        metadata: {
          ...ctx.metadata,
          projetoId: String(target.projetoId),
          viabilizacaoId: String(target.viabilizacaoId),
        },
      },
      createdBy: 'system',
    });

    return normalizeStoredUploadResult({
      url: evidence.url,
      path: evidence.path,
      size: evidence.tamanho,
      mimeType: evidence.mimeType ?? undefined,
      filename: evidence.nomeArquivo ?? undefined,
    });
  }

  private async resolveTarget(
    ctx: EvidenceContext,
  ): Promise<PosteViabilizacaoTarget> {
    const posteId = this.parseRequiredInt(ctx.entityId, 'entityId');
    const poste = await this.prisma.projPoste.findFirst({
      where: {
        id: posteId,
        deletedAt: null,
        viabilizacao: {
          deletedAt: null,
          projeto: { deletedAt: null },
        },
      },
      select: {
        id: true,
        viabilizacaoId: true,
        viabilizacao: {
          select: {
            projetoId: true,
          },
        },
      },
    });

    if (!poste) {
      throw AppError.notFound('Poste do projeto não encontrado para upload');
    }

    const metadataViabilizacaoId = this.parseOptionalInt(
      ctx.metadata?.['viabilizacaoId'],
    );
    if (
      metadataViabilizacaoId !== null &&
      metadataViabilizacaoId !== poste.viabilizacaoId
    ) {
      throw AppError.validation(
        'viabilizacaoId informado não corresponde ao poste enviado',
      );
    }

    return {
      posteId: poste.id,
      projetoId: poste.viabilizacao.projetoId,
      viabilizacaoId: poste.viabilizacaoId,
    };
  }

  private buildIdempotencyKey(
    ctx: EvidenceContext,
    fingerprint: UploadFingerprint,
  ): string {
    return `${this.type}:${ctx.entityType ?? 'projPoste'}:${ctx.entityId}:${fingerprint.checksum}`;
  }

  private parseRequiredInt(value: unknown, fieldName: string): number {
    const parsed = this.parseOptionalInt(value);
    if (parsed === null) {
      throw AppError.validation(`${fieldName} obrigatório e numérico`);
    }
    return parsed;
  }

  private parseOptionalInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const parsed = Math.trunc(value);
      return parsed > 0 ? parsed : null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!/^\d+$/.test(trimmed)) {
        return null;
      }
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
    }

    return null;
  }
}

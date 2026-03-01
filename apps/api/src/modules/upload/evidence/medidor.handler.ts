import { Injectable } from '@nestjs/common';
import { AppError } from '../../../core/errors/app-error';
import { PrismaService } from '../../../database/prisma.service';
import type {
  EvidenceHandler,
  EvidenceContext,
  UploadResult,
} from './evidence.handler';
import { CANONICAL_PHOTO_METADATA_OPTIONAL_FIELDS } from './common-metadata-spec';
import { UploadEvidenceLinkService } from './upload-evidence-link.service';

@Injectable()
export class MedidorEvidenceHandler implements EvidenceHandler {
  readonly type = 'medidor';

  metadataSpec = {
    required: ['turnoId'],
    optional: [
      'medidorId',
      'medicaoId',
      ...CANONICAL_PHOTO_METADATA_OPTIONAL_FIELDS,
    ],
    description:
      'Foto do medidor/medição. Compatível com fluxos antigos e novo upload de atividade.',
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly linkService: UploadEvidenceLinkService,
  ) {}

  validate(ctx: EvidenceContext): Promise<void> {
    if (!ctx.entityId) {
      throw AppError.validation('entityId (medicaoId) obrigatório');
    }
    const { turnoId } = ctx.metadata ?? {};
    if (turnoId == null) {
      throw AppError.validation('turnoId obrigatório');
    }
    return Promise.resolve();
  }

  buildStoragePath(ctx: EvidenceContext, filename: string) {
    const id = String(ctx.entityId).replace(/[/\\]/g, '-');
    return `medidores/${id}/${Date.now()}-${filename}`;
  }

  async persist(ctx: EvidenceContext, upload: UploadResult) {
    const evidence = await this.prisma.uploadEvidence.create({
      data: {
        tipo: this.type,
        entityType: ctx.entityType ?? 'medicao',
        entityId: String(ctx.entityId),
        url: upload.url,
        path: upload.path,
        tamanho: upload.size,
        mimeType: upload.mimeType,
        nomeArquivo: upload.filename,
        createdBy: 'system',
      },
      select: { id: true },
    });

    await this.linkService.upsertFromEvidence({
      uploadEvidenceId: evidence.id,
      ctx,
      createdBy: 'system',
    });
  }
}

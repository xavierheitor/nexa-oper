import { Injectable } from '@nestjs/common';
import { AppError } from '../../../core/errors/app-error';
import { PrismaService } from '../../../database/prisma.service';
import type {
  EvidenceHandler,
  EvidenceContext,
  UploadResult,
} from './evidence.handler';

@Injectable()
export class AtividadeTurnoEvidenceHandler implements EvidenceHandler {
  readonly type = 'atividade-turno';

  metadataSpec = {
    required: ['turnoId'],
    optional: [],
    description:
      'Foto associada à atividade e ao turno. entityId = atividadeId.',
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  validate(ctx: EvidenceContext): Promise<void> {
    if (!ctx.entityId) {
      throw AppError.validation('entityId (atividadeId) obrigatório');
    }
    const { turnoId } = ctx.metadata ?? {};
    if (turnoId == null) {
      throw AppError.validation('turnoId obrigatório');
    }
    return Promise.resolve();
  }

  buildStoragePath(ctx: EvidenceContext, filename: string) {
    const id = String(ctx.entityId).replace(/[/\\]/g, '-');
    return `atividades/${id}/${Date.now()}-${filename}`;
  }

  async persist(ctx: EvidenceContext, upload: UploadResult) {
    await this.prisma.uploadEvidence.create({
      data: {
        tipo: this.type,
        entityType: ctx.entityType ?? 'atividade',
        entityId: String(ctx.entityId),
        url: upload.url,
        path: upload.path,
        tamanho: upload.size,
        mimeType: upload.mimeType,
        nomeArquivo: upload.filename,
        createdBy: 'system',
      },
    });
  }
}

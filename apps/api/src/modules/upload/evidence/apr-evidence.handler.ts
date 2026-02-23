import { Injectable } from '@nestjs/common';
import { AppError } from '../../../core/errors/app-error';
import { PrismaService } from '../../../database/prisma.service';
import type {
  EvidenceHandler,
  EvidenceContext,
  UploadResult,
} from './evidence.handler';

@Injectable()
export class AprEvidenceHandler implements EvidenceHandler {
  readonly type = 'apr-evidence';

  metadataSpec = {
    required: ['turnoId', 'aprPerguntaId'],
    optional: [],
    description:
      'Evidência fotográfica para pergunta de APR. entityId = aprPreenchidoId.',
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  validate(ctx: EvidenceContext): Promise<void> {
    if (!ctx.entityId) {
      throw AppError.validation('entityId (aprPreenchidoId) obrigatório');
    }
    const { turnoId, aprPerguntaId } = ctx.metadata ?? {};
    if (turnoId == null || aprPerguntaId == null) {
      throw AppError.validation('turnoId e aprPerguntaId obrigatórios');
    }
    return Promise.resolve();
  }

  buildStoragePath(ctx: EvidenceContext, filename: string) {
    const id = String(ctx.entityId).replace(/[/\\]/g, '-');
    return `apr/${id}/${Date.now()}-${filename}`;
  }

  async persist(ctx: EvidenceContext, upload: UploadResult) {
    await this.prisma.uploadEvidence.create({
      data: {
        tipo: this.type,
        entityType: ctx.entityType ?? 'aprPreenchido',
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

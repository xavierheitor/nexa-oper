import { Injectable } from '@nestjs/common';
import { AppError } from '../../../core/errors/app-error';
import { PrismaService } from '../../../database/prisma.service';
import type {
  EvidenceHandler,
  EvidenceContext,
  UploadResult,
} from './evidence.handler';

@Injectable()
export class MedidorEvidenceHandler implements EvidenceHandler {
  readonly type = 'medidor';

  metadataSpec = {
    required: ['turnoId'],
    optional: ['medidorId', 'medicaoId'],
    description:
      'Foto do medidor/medição. Compatível com fluxos antigos e novo upload de atividade.',
  } as const;

  constructor(private readonly prisma: PrismaService) {}

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
    await this.prisma.uploadEvidence.create({
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
    });
  }
}

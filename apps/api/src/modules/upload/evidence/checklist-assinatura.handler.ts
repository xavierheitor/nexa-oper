import { Injectable } from '@nestjs/common';
import { AppError } from '../../../core/errors/app-error';
import { PrismaService } from '../../../database/prisma.service';
import type {
  EvidenceHandler,
  EvidenceContext,
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

  async persist(ctx: EvidenceContext, upload: UploadResult) {
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
  }
}

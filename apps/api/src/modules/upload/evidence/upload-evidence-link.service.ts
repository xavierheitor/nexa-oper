import { Injectable } from '@nestjs/common';
import type { Prisma } from '@nexa-oper/db';
import { AppLogger } from '../../../core/logger/app-logger';
import { PrismaService } from '../../../database/prisma.service';
import type { EvidenceContext } from './evidence.handler';

type CanonicalLinkData = {
  ownerType: string;
  ownerRef: string;
  photoCategory: string;
  tipo: string;
  entityType: string;
  entityId: string;
  turnoId: number | null;
  servicoId: number | null;
  checklistPreenchidoId: number | null;
  checklistRespostaId: number | null;
  sequenciaAssinatura: number | null;
  atividadeUuid: string | null;
  atividadeContexto: string | null;
  aprUuid: string | null;
  syncSchemaVersion: number | null;
  syncOrigin: string | null;
  clientPhotoId: number | null;
  metadataJson: Prisma.InputJsonValue | undefined;
};

const LINK_OWNER_TYPE_BY_UPLOAD_TYPE: Record<string, string> = {
  'checklist-reprova': 'checklist',
  'checklist-assinatura': 'checklist',
  'atividade-turno': 'atividade',
  'apr-evidence': 'apr',
  medidor: 'atividadeMedidor',
  servico: 'servico',
};

const LINK_ENTITY_TYPE_BY_OWNER_TYPE: Record<string, string> = {
  checklist: 'checklistPreenchido',
  atividade: 'atividade',
  atividadeMedidor: 'medicao',
  medidor: 'medicao',
  apr: 'aprPreenchido',
  servico: 'servico',
};

@Injectable()
export class UploadEvidenceLinkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async upsertFromEvidence(params: {
    uploadEvidenceId: number;
    ctx: EvidenceContext;
    createdBy?: string;
  }): Promise<void> {
    const canonical = this.resolveCanonicalData(params.ctx);

    await this.prisma.uploadEvidenceLink.upsert({
      where: {
        uploadEvidenceId_ownerType_ownerRef_photoCategory: {
          uploadEvidenceId: params.uploadEvidenceId,
          ownerType: canonical.ownerType,
          ownerRef: canonical.ownerRef,
          photoCategory: canonical.photoCategory,
        },
      },
      create: {
        uploadEvidenceId: params.uploadEvidenceId,
        ...canonical,
        createdBy: params.createdBy ?? 'system',
      },
      update: {
        ...canonical,
      },
    });
  }

  private resolveCanonicalData(ctx: EvidenceContext): CanonicalLinkData {
    const metadata = ctx.metadata ?? {};
    const ownerType =
      this.readString(metadata.ownerType) ??
      LINK_OWNER_TYPE_BY_UPLOAD_TYPE[ctx.type] ??
      'unknown';
    const ownerRef =
      this.readString(metadata.ownerRef) ??
      this.readString(metadata.atividadeUuid) ??
      this.readString(metadata.aprUuid) ??
      ctx.entityId;
    const photoCategory =
      this.readString(metadata.photoCategory) ??
      this.inferPhotoCategory(ctx.type, ownerType, metadata);

    const entityType =
      this.readString(ctx.entityType) ??
      LINK_ENTITY_TYPE_BY_OWNER_TYPE[ownerType] ??
      'unknown';

    const turnoId =
      this.readInt(metadata.turnoId) ?? this.readInt(metadata.turnoLocalId);
    const servicoId =
      this.readInt(metadata.servicoId) ?? this.readInt(metadata.servicoLocalId);

    const checklistPreenchidoId =
      this.readInt(metadata.checklistPreenchidoId) ??
      this.readInt(metadata.checklistPreenchidoLocalId) ??
      (entityType === 'checklistPreenchido'
        ? this.readInt(ctx.entityId)
        : null);

    const checklistRespostaId =
      this.readInt(metadata.checklistRespostaId) ??
      this.readInt(metadata.checklistRespostaLocalId);

    const atividadeUuid =
      this.readString(metadata.atividadeUuid) ??
      (ownerType === 'atividade' ? this.readString(ownerRef) : null);

    const aprUuid =
      this.readString(metadata.aprUuid) ??
      (ownerType === 'apr' ? this.readString(ownerRef) : null);

    return {
      ownerType,
      ownerRef,
      photoCategory,
      tipo: ctx.type,
      entityType,
      entityId: ctx.entityId,
      turnoId,
      servicoId,
      checklistPreenchidoId,
      checklistRespostaId,
      sequenciaAssinatura: this.readInt(metadata.sequenciaAssinatura),
      atividadeUuid,
      atividadeContexto: this.readString(metadata.atividadeContexto),
      aprUuid,
      syncSchemaVersion: this.readInt(metadata.syncSchemaVersion),
      syncOrigin: this.readString(metadata.syncOrigin),
      clientPhotoId: this.readInt(metadata.clientPhotoId),
      metadataJson: this.toSafeJson(metadata),
    };
  }

  private inferPhotoCategory(
    uploadType: string,
    ownerType: string,
    metadata: Record<string, any>,
  ): string {
    const atividadeContexto = this.readString(metadata.atividadeContexto);
    const explicitType = this.readString(metadata.photoType);

    if (
      explicitType === 'medidor' &&
      atividadeContexto === 'medidor:instalado'
    ) {
      return 'MEDIDOR_INSTALADO';
    }
    if (
      explicitType === 'medidor' &&
      atividadeContexto === 'medidor:retirado'
    ) {
      return 'MEDIDOR_RETIRADO';
    }

    switch (uploadType) {
      case 'checklist-reprova':
        return 'CHECKLIST_REPROVA';
      case 'checklist-assinatura':
        return ownerType === 'apr' ? 'APR_ASSINATURA' : 'CHECKLIST_ASSINATURA';
      case 'apr-evidence':
        return 'APR_EVIDENCIA';
      case 'medidor':
        if (atividadeContexto === 'medidor:instalado')
          return 'MEDIDOR_INSTALADO';
        if (atividadeContexto === 'medidor:retirado') return 'MEDIDOR_RETIRADO';
        return 'MEDIDOR';
      case 'atividade-turno':
        if (atividadeContexto?.startsWith('form:') === true) {
          return 'ATIVIDADE_SERVICO';
        }
        if (atividadeContexto === 'finalizacao') {
          return 'ATIVIDADE_FINALIZACAO';
        }
        return 'ATIVIDADE_GERAL';
      case 'servico':
        return 'SERVICO';
      default:
        this.logger.warn('Categoria de foto inferida como UNKNOWN', {
          uploadType,
          ownerType,
        });
        return 'UNKNOWN';
    }
  }

  private readString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private readInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value);
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private toSafeJson(value: unknown): Prisma.InputJsonValue | undefined {
    const encoded = this.encodeJson(value);
    if (encoded === undefined) return undefined;
    return encoded as Prisma.InputJsonValue;
  }

  private encodeJson(value: unknown): unknown {
    if (value === null) return null;
    if (value === undefined) return undefined;
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    if (Array.isArray(value)) {
      return value
        .map((item) => this.encodeJson(item))
        .filter((item) => item !== undefined);
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
        .map(([key, item]) => [key, this.encodeJson(item)] as const)
        .filter(([, item]) => item !== undefined);
      return Object.fromEntries(entries);
    }
    return String(value);
  }
}

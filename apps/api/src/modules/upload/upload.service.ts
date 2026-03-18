import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import * as path from 'node:path';
import type {
  UploadEvidenceFileContract,
  UploadEvidenceRequestContract,
  UploadEvidenceResponseContract,
} from '../../contracts/upload/upload.contract';
import { AppLogger } from '../../core/logger/app-logger';
import type { UploadProcessorPort } from './domain/ports/upload-processor.port';
import type { UploadFingerprint } from './evidence/evidence.handler';
import type { StorageAdapter } from './storage/storage.adapter';
import { normalizeStoredUploadResult } from './storage/upload-url';
import { UploadRegistry } from './upload.registry';

const NUMERIC_METADATA_KEYS = [
  'turnoId',
  'checklistPerguntaId',
  'sequenciaAssinatura',
  'servicoId',
  'aprPerguntaId',
  'medidorId',
  'medicaoId',
  'atividadeId',
  'syncSchemaVersion',
  'clientPhotoId',
  'turnoLocalId',
  'checklistPreenchidoLocalId',
  'checklistRespostaLocalId',
  'servicoLocalId',
] as const;

function normalizeMetadata(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...raw };
  for (const key of NUMERIC_METADATA_KEYS) {
    const v = out[key];
    if (typeof v === 'string' && /^\d+$/.test(v)) {
      out[key] = parseInt(v, 10);
    }
  }
  return out;
}

function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function inferEntityTypeFromOwnerType(ownerType: unknown): string | undefined {
  const value = readNonEmptyString(ownerType);
  if (!value) return undefined;

  switch (value) {
    case 'checklist':
      return 'checklistPreenchido';
    case 'atividade':
      return 'atividade';
    case 'atividadeMedidor':
    case 'medidor':
      return 'medicao';
    case 'apr':
      return 'aprPreenchido';
    case 'servico':
      return 'servico';
    default:
      return undefined;
  }
}

function sanitizeFilename(filename: string): string {
  const base = path.basename(filename);
  const ascii = base.replace(/[^\x20-\x7E]/g, '');
  const clean = ascii
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '');
  const trimmed = clean.slice(0, 120);
  return trimmed || 'file';
}

function sha256Hex(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Serviço responsável pelo processamento de uploads.
 *
 * Normaliza metadados, valida o contexto através do handler registrado,
 * salva o arquivo no storage e persiste as informações de negócio.
 */
@Injectable()
export class UploadService implements UploadProcessorPort {
  constructor(
    @Inject('STORAGE_ADAPTER') private readonly storage: StorageAdapter,
    private readonly registry: UploadRegistry,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Processa o upload de um arquivo.
   *
   * 1. Normaliza metadados (converte strings numéricas em números).
   * 2. Recupera o handler específico para o `type`.
   * 3. Valida o contexto (check permissions, existência de registros).
   * 4. Gera o caminho de armazenamento.
   * 5. Salva o arquivo no storage configurado (Local ou S3).
   * 6. Persiste os dados de negócio (chama `handler.persist`).
   *
   * @param file - Objeto do arquivo (buffer, mimetype, etc).
   * @param body - Metadados da requisição.
   * @returns Resultado do upload retornado pelo storage adapter.
   */
  async upload(
    file: UploadEvidenceFileContract,
    body: UploadEvidenceRequestContract,
  ): Promise<UploadEvidenceResponseContract> {
    const metadata = normalizeMetadata(body);
    const explicitEntityType = readNonEmptyString(body.entityType);
    const inferredEntityType = inferEntityTypeFromOwnerType(
      metadata['ownerType'],
    );

    const ctx = {
      type: body.type,
      entityId: String(body.entityId),
      entityType: explicitEntityType ?? inferredEntityType,
      metadata,
    };

    const handler = this.registry.get(ctx.type);

    await handler.validate(ctx);

    const safeFilename = sanitizeFilename(file.originalname);
    const fingerprint: UploadFingerprint = {
      checksum: sha256Hex(file.buffer),
      size: file.size,
      mimeType: file.mimetype,
      filename: safeFilename,
    };

    const existing = await handler.findExisting?.(ctx, fingerprint);
    if (existing) {
      const normalizedExisting = normalizeStoredUploadResult(existing);
      this.logger.debug('Upload duplicado detectado (idempotência)', {
        type: ctx.type,
        entityId: ctx.entityId,
        checksum: fingerprint.checksum,
      });
      return normalizedExisting;
    }

    const path = handler.buildStoragePath(ctx, safeFilename);

    const uploadResult = normalizeStoredUploadResult(
      await this.storage.upload({
        buffer: file.buffer,
        mimeType: file.mimetype,
        size: file.size,
        path,
      }),
    );

    let persistedResult: UploadEvidenceResponseContract | void;
    try {
      persistedResult = await handler.persist(
        ctx,
        {
          ...uploadResult,
          filename: safeFilename,
        },
        fingerprint,
      );
    } catch (error: unknown) {
      try {
        await this.storage.delete(uploadResult.path);
      } catch (cleanupError: unknown) {
        this.logger.error(
          'Falha ao remover arquivo após erro de persistência de upload',
          cleanupError,
          { path: uploadResult.path, type: ctx.type, entityId: ctx.entityId },
        );
      }
      throw error;
    }

    if (persistedResult && persistedResult.path !== uploadResult.path) {
      try {
        await this.storage.delete(uploadResult.path);
      } catch (cleanupError: unknown) {
        this.logger.error(
          'Falha ao remover arquivo duplicado após deduplicação',
          cleanupError,
          { path: uploadResult.path, type: ctx.type, entityId: ctx.entityId },
        );
      }
      return normalizeStoredUploadResult(persistedResult);
    }

    if (persistedResult) {
      return normalizeStoredUploadResult(persistedResult);
    }

    return uploadResult;
  }
}

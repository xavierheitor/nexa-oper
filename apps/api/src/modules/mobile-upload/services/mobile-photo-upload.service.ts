/**
 * Serviço responsável por processar uploads de fotos enviados pelo aplicativo mobile.
 */

import { randomUUID, createHash } from 'crypto';
import { extname, join } from 'path';

import {
  ALLOWED_MOBILE_PHOTO_MIME_TYPES,
  MAX_MOBILE_PHOTO_FILE_SIZE,
  MOBILE_PHOTO_UPLOAD_ROOT,
  SUPPORTED_MOBILE_PHOTO_TYPES,
} from '@common/constants/mobile-upload';
import { STORAGE_PORT, type StoragePort } from '@common/storage/storage.port';
import { createAuditData, getDefaultUserContext } from '@common/utils/audit';
import { sanitizeData } from '@common/utils/logger';
import { DatabaseService } from '@database/database.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { FotoPendenciaProcessorService } from './foto-pendencia-processor.service';
import { PhotoUploadDto, PhotoUploadResponseDto } from '../dto';

type MulterFile = Express.Multer.File;

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/**
 * Serviço de upload de fotos mobile.
 *
 * Responsável por validar arquivos, garantir idempotência e persistir
 * metadados no banco de dados, retornando a URL para o aplicativo.
 */
@Injectable()
export class MobilePhotoUploadService {
  private readonly logger = new Logger(MobilePhotoUploadService.name);

  constructor(
    private readonly db: DatabaseService,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly pendenciaProcessor: FotoPendenciaProcessorService
  ) {}

  /**
   * Processa o upload de uma foto recebida do aplicativo mobile.
   */
  async handleUpload(
    file: MulterFile | undefined,
    payload: PhotoUploadDto,
    userId?: string
  ): Promise<PhotoUploadResponseDto> {
    this.logger.debug(
      `[UPLOAD] Iniciando upload - tipo: ${payload.tipo}, turnoId: ${payload.turnoId}`
    );
    this.logger.debug(
      `[UPLOAD] Payload completo:`,
      JSON.stringify(sanitizeData(payload), null, 2)
    );

    file = this.validateUploadInput(file, payload);
    const checksum = this.computeChecksum(file.buffer);

    const duplicate = await this.findExistingByChecksum(checksum);
    if (duplicate) return duplicate;

    const extension = this.resolveExtension(file);
    const relativePath = this.buildRelativePath(payload.turnoId, extension);
    const key = relativePath.urlPath;

    await this.storage.put({
      key,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    const absolutePath = join(MOBILE_PHOTO_UPLOAD_ROOT, ...relativePath.parts);
    const relativeUrlPath = `/mobile/photos/${relativePath.urlPath}`;
    const audit = createAuditData(
      userId
        ? { userId, userName: userId, roles: ['mobile'] }
        : getDefaultUserContext()
    );

    const createResult = await this.createMobilePhotoOrReturnDuplicate({
      payload,
      file,
      checksum,
      relativePath,
      key,
      absolutePath,
      relativeUrlPath,
      audit,
    });
    if ('status' in createResult) return createResult;

    const { mobilePhoto } = createResult;
    this.logger.debug(
      `[UPLOAD] Foto mobile salva - ID: ${mobilePhoto.id}, tipo: ${mobilePhoto.tipo}`
    );

    await this.processPendenciaSeAplicavel(payload, mobilePhoto);

    this.logger.log(
      `Foto armazenada com sucesso: turno ${payload.turnoId} - ${relativePath.fileName}`
    );
    return {
      status: 'stored',
      url: this.storage.getPublicUrl(key),
      checksum,
    };
  }

  private validateUploadInput(
    file: MulterFile | undefined,
    payload: PhotoUploadDto
  ): MulterFile {
    if (!file) {
      throw new BadRequestException('Arquivo da foto é obrigatório');
    }
    if (
      (payload.tipo === 'checklistReprova' || payload.tipo === 'assinatura') &&
      (!payload.checklistUuid || payload.checklistUuid.trim() === '')
    ) {
      throw new BadRequestException(
        `Fotos do tipo '${payload.tipo}' devem incluir checklistUuid obrigatório`
      );
    }
    this.validateFile(file);
    return file;
  }

  private async findExistingByChecksum(
    checksum: string
  ): Promise<PhotoUploadResponseDto | null> {
    const existing = await this.db
      .getPrisma()
      .mobilePhoto.findUnique({ where: { checksum } });
    if (!existing) return null;
    this.logger.debug(
      `Foto duplicada detectada para checksum ${checksum}, retornando URL existente`
    );
    return {
      status: 'duplicate',
      url: existing.url,
      checksum: existing.checksum,
    };
  }

  private async createMobilePhotoOrReturnDuplicate(params: {
    payload: PhotoUploadDto;
    file: MulterFile;
    checksum: string;
    relativePath: { fileName: string; urlPath: string };
    key: string;
    absolutePath: string;
    relativeUrlPath: string;
    audit: ReturnType<typeof createAuditData>;
  }): Promise<
    { mobilePhoto: { id: number; tipo: string } } | PhotoUploadResponseDto
  > {
    const {
      payload,
      file,
      checksum,
      relativePath,
      key,
      absolutePath,
      relativeUrlPath,
      audit,
    } = params;
    try {
      const mobilePhoto = await this.db.getPrisma().mobilePhoto.create({
        data: {
          turnoId: payload.turnoId,
          tipo: this.normalizePhotoType(payload.tipo),
          checklistUuid: payload.checklistUuid ?? null,
          checklistPerguntaId: payload.checklistPerguntaId ?? null,
          sequenciaAssinatura: payload.sequenciaAssinatura ?? null,
          servicoId: payload.servicoId ?? null,
          fileName: relativePath.fileName,
          mimeType: file.mimetype,
          fileSize: file.size,
          checksum,
          storagePath: absolutePath,
          url: relativeUrlPath,
          capturedAt: new Date(),
          ...audit,
        },
      });
      return { mobilePhoto };
    } catch (err: unknown) {
      try {
        await this.storage.delete(key);
      } catch (deleteErr) {
        this.logger.warn(
          `[UPLOAD] Falha ao remover arquivo órfão após erro no create: ${key}`,
          deleteErr
        );
      }
      const e = err as { code?: string };
      if (e?.code === 'P2002') {
        const existing = await this.db
          .getPrisma()
          .mobilePhoto.findUnique({ where: { checksum } });
        if (existing) {
          return {
            status: 'duplicate',
            url: existing.url,
            checksum: existing.checksum,
          };
        }
      }
      throw err;
    }
  }

  private async processPendenciaSeAplicavel(
    payload: PhotoUploadDto,
    mobilePhoto: { id: number }
  ): Promise<void> {
    const shouldProcessPendencia =
      (payload.tipo === 'pendencia' || payload.tipo === 'checklistReprova') &&
      payload.checklistPerguntaId;

    this.logger.debug(
      `[UPLOAD] Deve processar pendência? ${shouldProcessPendencia}`
    );
    this.logger.debug(
      `[UPLOAD] Condições: tipo=${payload.tipo}, checklistUuid=${payload.checklistUuid}, checklistPerguntaId=${payload.checklistPerguntaId}`
    );

    if (shouldProcessPendencia) {
      this.logger.debug(`[UPLOAD] Iniciando processamento de pendência...`);
      if (payload.checklistUuid && payload.checklistUuid.trim() !== '') {
        await this.pendenciaProcessor.processarComUuid(
          mobilePhoto.id,
          payload.turnoId,
          payload.checklistUuid,
          payload.checklistPerguntaId!
        );
      } else {
        await this.pendenciaProcessor.processarSemUuid(
          mobilePhoto.id,
          payload.turnoId,
          payload.checklistPerguntaId!
        );
      }
    } else {
      this.logger.debug(`[UPLOAD] Pulando processamento de pendência`);
    }
  }

  /**
   * Garante que o arquivo está dentro dos limites aceitos.
   */
  private validateFile(file: MulterFile): void {
    if (file.size > MAX_MOBILE_PHOTO_FILE_SIZE) {
      throw new BadRequestException(
        'Arquivo excede o tamanho máximo permitido'
      );
    }

    if (!ALLOWED_MOBILE_PHOTO_MIME_TYPES.includes(file.mimetype as any)) {
      throw new BadRequestException('Tipo de arquivo não suportado');
    }
  }

  /**
   * Normaliza o tipo da foto para evitar divergência na persistência.
   */
  private normalizePhotoType(tipo: string): string {
    if (SUPPORTED_MOBILE_PHOTO_TYPES.includes(tipo as any)) {
      return tipo;
    }

    this.logger.warn(
      `Tipo de foto "${tipo}" não reconhecido, mantendo valor original`
    );
    return tipo;
  }

  /**
   * Calcula o checksum para garantir idempotência.
   */
  private computeChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Retorna a extensão do arquivo a partir do mimetype ou nome original.
   */
  private resolveExtension(file: MulterFile): string {
    if (MIME_EXTENSION_MAP[file.mimetype]) {
      return MIME_EXTENSION_MAP[file.mimetype];
    }

    const originalExt = extname(file.originalname);
    if (originalExt) {
      return originalExt.replace('.', '').toLowerCase();
    }

    return 'bin';
  }

  /**
   * Monta o caminho relativo onde a foto será armazenada.
   */
  private buildRelativePath(
    turnoId: number,
    extension: string
  ): {
    parts: string[];
    fileName: string;
    urlPath: string;
  } {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .replace(/\..+/, '');

    const fileName = `${turnoId}_${timestamp}_${randomUUID()}.${extension}`;
    const parts = [turnoId.toString(), fileName];
    const urlPath = parts.join('/');

    return { parts, fileName, urlPath };
  }
}

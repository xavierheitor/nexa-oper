/**
 * Serviço responsável por processar uploads de fotos enviados pelo aplicativo mobile.
 */

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { randomUUID, createHash } from 'crypto';
import { dirname, extname, join, sep } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import {
  ALLOWED_MOBILE_PHOTO_MIME_TYPES,
  MAX_MOBILE_PHOTO_FILE_SIZE,
  MOBILE_PHOTO_UPLOAD_PUBLIC_PREFIX,
  MOBILE_PHOTO_UPLOAD_ROOT,
  SUPPORTED_MOBILE_PHOTO_TYPES,
} from '../constants/mobile-upload.constants';
import { PhotoUploadDto, PhotoUploadResponseDto } from '../dto';
import {
  createAuditData,
  getDefaultUserContext,
} from '@common/utils/audit';

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

  constructor(private readonly db: DatabaseService) {}

  /**
   * Processa o upload de uma foto recebida do aplicativo mobile.
   */
  async handleUpload(
    file: MulterFile | undefined,
    payload: PhotoUploadDto
  ): Promise<PhotoUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Arquivo da foto é obrigatório');
    }

    this.validateFile(file);

    const checksum = this.computeChecksum(file.buffer);

    // Verificar duplicidade antes de escrever no disco
    const existing = await this.db
      .getPrisma()
      .mobilePhoto.findUnique({ where: { checksum } });

    if (existing) {
      this.logger.debug(
        `Foto duplicada detectada para checksum ${checksum}, retornando URL existente`
      );

      return {
        status: 'duplicate',
        url: existing.url,
        checksum: existing.checksum,
      };
    }

    const extension = this.resolveExtension(file);
    const relativePath = this.buildRelativePath(payload.turnoId, extension);
    const absolutePath = join(MOBILE_PHOTO_UPLOAD_ROOT, ...relativePath.parts);

    await this.ensureDirectory(dirname(absolutePath));
    await writeFile(absolutePath, file.buffer);

    const url = this.buildPublicUrl(relativePath.urlPath);

    const audit = createAuditData(getDefaultUserContext());

    await this.db.getPrisma().mobilePhoto.create({
      data: {
        turnoId: payload.turnoId,
        tipo: this.normalizePhotoType(payload.tipo),
        checklistPreenchidoId: payload.checklistPreenchidoId ?? null,
        checklistRespostaId: payload.checklistRespostaId ?? null,
        sequenciaAssinatura: payload.sequenciaAssinatura ?? null,
        servicoId: payload.servicoId ?? null,
        fileName: relativePath.fileName,
        mimeType: file.mimetype,
        fileSize: file.size,
        checksum,
        storagePath: absolutePath,
        url,
        capturedAt: new Date(),
        ...audit,
      },
    });

    this.logger.log(
      `Foto armazenada com sucesso: turno ${payload.turnoId} - ${relativePath.fileName}`
    );

    return {
      status: 'stored',
      url,
      checksum,
    };
  }

  /**
   * Garante que o arquivo está dentro dos limites aceitos.
   */
  private validateFile(file: MulterFile): void {
    if (file.size > MAX_MOBILE_PHOTO_FILE_SIZE) {
      throw new BadRequestException('Arquivo excede o tamanho máximo permitido');
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
  private buildRelativePath(turnoId: number, extension: string): {
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

  /**
   * Garante que o diretório existe antes de salvar o arquivo.
   */
  private async ensureDirectory(directory: string): Promise<void> {
    await mkdir(directory, { recursive: true });
  }

  /**
   * Constrói a URL pública a partir do caminho relativo.
   */
  private buildPublicUrl(relativePath: string): string {
    const normalized = relativePath.split(sep).join('/');
    return `${MOBILE_PHOTO_UPLOAD_PUBLIC_PREFIX}/${normalized}`;
  }
}

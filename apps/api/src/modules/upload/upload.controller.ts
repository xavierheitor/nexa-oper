import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { AppError } from '../../core/errors/app-error';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {
  UploadEvidenceRequestContract,
  UploadEvidenceResponseContract,
  UploadTypesResponseContract,
} from '../../contracts/upload/upload.contract';
import { env } from '../../core/config/env';
import { ListUploadTypesUseCase } from './application/use-cases/list-upload-types.use-case';
import { UploadEvidenceUseCase } from './application/use-cases/upload-evidence.use-case';
import { UploadRequestDto } from './dto/upload-request.dto';

/** ValidationPipe com whitelist: false para preservar metadados extras no body */
const uploadBodyPipe = new ValidationPipe({
  transform: true,
  whitelist: false,
  forbidNonWhitelisted: false,
});

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

/**
 * Controller responsável pelo upload de evidências e arquivos.
 *
 * Gerencia o recebimento de arquivos via multipart/form-data e delega
 * o processamento para handlers específicos baseados no `type` informado.
 */
@ApiTags('upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadEvidenceUseCase: UploadEvidenceUseCase,
    private readonly listUploadTypesUseCase: ListUploadTypesUseCase,
  ) {}

  /**
   * Lista os tipos de upload suportados e suas especificações de metadados.
   *
   * Útil para o frontend saber quais campos extras enviar para cada tipo de evidência.
   *
   * @returns Objeto contendo lista de tipos e seus schemas de metadados.
   */
  @Get('types')
  @ApiOperation({
    summary: 'Listar tipos de upload',
    description: 'Retorna os tipos disponíveis e seus MetadataSpec.',
  })
  @ApiOkResponse({
    description: 'Lista de tipos com especificação de metadados',
  })
  listTypes(): UploadTypesResponseContract {
    return this.listUploadTypesUseCase.execute();
  }

  /**
   * Realiza o upload de um arquivo.
   *
   * Requer `file` (multipart), `type` e `entityId`.
   * Outros campos podem ser necessários dependendo do `type` (ex: `checklistPerguntaId`).
   *
   * @param file - Arquivo enviado.
   * @param body - Metadados do upload (type, entityId, etc).
   * @returns Resultado do upload (caminho, url, etc).
   * @throws {AppError} Se o arquivo não for enviado ou validação do handler falhar.
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: env.UPLOAD_MAX_FILE_SIZE_BYTES },
    }),
  )
  @ApiOperation({
    summary: 'Upload de evidência',
    description:
      'Envia arquivo (foto, PDF) como evidência. type define o handler; metadados extras são validados pelo handler.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'type', 'entityId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', example: 'checklist-reprova' },
        entityType: { type: 'string', example: 'checklistPreenchido' },
        entityId: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        turnoId: { type: 'integer', example: 123 },
        checklistPerguntaId: { type: 'integer', example: 5 },
      },
    },
  })
  @ApiOkResponse({ description: 'Upload realizado com sucesso' })
  async upload(
    @UploadedFile()
    file:
      | { buffer: Buffer; mimetype: string; size: number; originalname: string }
      | undefined,
    @Body(uploadBodyPipe)
    body: UploadRequestDto & UploadEvidenceRequestContract,
  ): Promise<UploadEvidenceResponseContract> {
    if (!file?.buffer) {
      throw AppError.validation('Arquivo obrigatório');
    }
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      throw AppError.validation(
        'Tipo de arquivo não suportado. Permitidos: JPEG, PNG, WEBP, HEIC, HEIF e PDF.',
      );
    }
    return this.uploadEvidenceUseCase.execute(file, body);
  }
}

/**
 * Controller responsável pelos uploads de fotos enviados pelo aplicativo mobile.
 */

import {
  Body,
  Controller,
  HttpStatus,
  Logger,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import {
  MAX_MOBILE_PHOTO_FILE_SIZE,
  SUPPORTED_MOBILE_PHOTO_TYPES,
} from '../constants/mobile-upload.constants';
import {
  PhotoUploadDto,
  PhotoUploadResponseDto,
} from '../dto';
import { MobilePhotoUploadService } from '../services';

/**
 * Controller para upload de fotos mobile.
 */
@ApiTags('mobile-upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/uploads/photos')
export class MobilePhotoUploadController {
  private readonly logger = new Logger(MobilePhotoUploadController.name);

  constructor(
    private readonly mobilePhotoUploadService: MobilePhotoUploadService
  ) {}

  /**
   * Recebe fotos enviadas em background pelo aplicativo mobile.
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_MOBILE_PHOTO_FILE_SIZE,
      },
    })
  )
  @ApiOperation({
    summary: 'Upload de foto mobile',
    description:
      'Armazena a foto enviada pelo aplicativo mobile garantindo idempotência',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Payload multipart contendo arquivo e metadados da foto',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        turnoId: {
          type: 'integer',
          example: 123,
        },
        tipo: {
          type: 'string',
          example: 'servico',
          enum: [...SUPPORTED_MOBILE_PHOTO_TYPES],
        },
        checklistUuid: {
          type: 'string',
          nullable: true,
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        checklistPerguntaId: {
          type: 'integer',
          nullable: true,
          example: 654,
        },
        sequenciaAssinatura: {
          type: 'integer',
          nullable: true,
          example: 1,
        },
        servicoId: {
          type: 'integer',
          nullable: true,
          example: 456,
        },
      },
      required: ['file', 'turnoId', 'tipo'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Foto armazenada com sucesso',
    type: PhotoUploadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Foto já havia sido processada anteriormente (idempotência garantida)',
    type: PhotoUploadResponseDto,
  })
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: PhotoUploadDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<PhotoUploadResponseDto> {
    this.logger.log(`Recebendo foto do turno ${body.turnoId}`);

    const result = await this.mobilePhotoUploadService.handleUpload(file, body);

    res.status(result.status === 'stored' ? HttpStatus.CREATED : HttpStatus.OK);

    return result;
  }
}

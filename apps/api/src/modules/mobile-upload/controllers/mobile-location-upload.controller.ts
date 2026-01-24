/**
 * Controller responsável pelos uploads de localizações enviados pelo aplicativo mobile.
 */

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { LocationUploadDto, LocationUploadResponseDto } from '../dto';
import { MobileLocationUploadService } from '../services';

import type { Response } from 'express';

/**
 * Controller para upload de localizações mobile.
 */
@ApiTags('mobile-upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/uploads/locations')
export class MobileLocationUploadController {
  private readonly logger = new Logger(MobileLocationUploadController.name);

  constructor(
    private readonly mobileLocationUploadService: MobileLocationUploadService
  ) {}

  /**
   * Recebe localizações do aplicativo mobile, garantindo idempotência.
   */
  @Post()
  @ApiOperation({
    summary: 'Upload de localização mobile',
    description:
      'Registra a posição enviada pelo aplicativo garantindo idempotência por assinatura',
  })
  @ApiBody({
    description: 'JSON com os metadados da localização capturada',
    type: LocationUploadDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Localização registrada com sucesso',
    type: LocationUploadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Localização já existia e foi reconhecida como duplicada (idempotência)',
    type: LocationUploadResponseDto,
  })
  async uploadLocation(
    @Body() body: LocationUploadDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LocationUploadResponseDto> {
    this.logger.log(`Recebendo localização do turno ${body.turnoId}`);

    const result = await this.mobileLocationUploadService.handleUpload(body);

    res.status(result.alreadyExisted ? HttpStatus.OK : HttpStatus.CREATED);

    return result;
  }
}

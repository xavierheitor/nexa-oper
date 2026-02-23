import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AppLogger } from '../../core/logger/app-logger';
import { GetUsuarioMobileId } from '../auth/modules/contract-permissions/decorators/get-usuario-mobile-id.decorator';
import {
  LocationUploadDto,
  LocationUploadResponseDto,
} from './dto/location-upload.dto';
import type {
  LocationUploadRequestContract,
  LocationUploadResponseContract,
} from '../../contracts/localizacao/location-upload.contract';
import { UploadLocationUseCase } from './application/use-cases/upload-location.use-case';

/**
 * Controller responsável pelos uploads de localizações enviados pelo aplicativo mobile.
 */
@ApiTags('localizacao')
@ApiBearerAuth()
@Controller('mobile/uploads/locations')
export class LocalizacaoController {
  constructor(
    private readonly uploadLocationUseCase: UploadLocationUseCase,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Recebe localizações do aplicativo mobile, garantindo idempotência.
   *
   * O payload é processado e, se a localização já tiver sido enviada (identificada por assinatura hash),
   * retorna sucesso mas indica que já existia.
   *
   * @param body - DTO contendo os dados da localização.
   * @param userId - ID do usuário mobile que enviou (extraído do token).
   * @returns DTO de resposta indicando status da operação.
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
    @GetUsuarioMobileId() userId: number | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LocationUploadResponseContract> {
    this.logger.info(`Recebendo localização do turno ${body.turnoId}`);

    const payload: LocationUploadRequestContract = body;
    const result = await this.uploadLocationUseCase.execute(payload, userId);

    res.status(result.alreadyExisted ? HttpStatus.OK : HttpStatus.CREATED);

    return result;
  }
}

import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type {
  InspecaoSegurancaUploadRequestContract,
  InspecaoSegurancaUploadResponseContract,
} from '../../contracts/inspecao-seguranca-upload/inspecao-seguranca-upload.contract';
import { AppLogger } from '../../core/logger/app-logger';
import { GetUsuarioMobileId } from '../auth/modules/contract-permissions/decorators/get-usuario-mobile-id.decorator';
import {
  InspecaoSegurancaUploadDto,
  InspecaoSegurancaUploadResponseDto,
} from './dto/inspecao-seguranca-upload.dto';
import { InspecaoSegurancaUploadService } from './inspecao-seguranca-upload.service';

@ApiTags('inspecao-seguranca-upload')
@ApiBearerAuth()
@Controller('mobile/uploads/safety-inspections')
export class InspecaoSegurancaUploadController {
  constructor(
    private readonly service: InspecaoSegurancaUploadService,
    private readonly logger: AppLogger,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Upload de inspeção de segurança preenchida',
    description:
      'Recebe inspeção de segurança realizada no app, preservando snapshots de perguntas/respostas, pendências e fotos inline.',
  })
  @ApiBody({
    description: 'Payload da inspeção de segurança realizada no app mobile',
    type: InspecaoSegurancaUploadDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Inspeção criada com sucesso',
    type: InspecaoSegurancaUploadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inspeção já existia (idempotência por UUID)',
    type: InspecaoSegurancaUploadResponseDto,
  })
  async upload(
    @Body() body: InspecaoSegurancaUploadDto,
    @GetUsuarioMobileId() userId: number | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<InspecaoSegurancaUploadResponseContract> {
    this.logger.info('Recebendo upload de inspeção de segurança', {
      inspecaoUuid: body.inspecaoUuid,
      turnoId: body.turnoId,
    });

    const payload: InspecaoSegurancaUploadRequestContract = body;
    const result = await this.service.upload(payload, userId);

    res.status(result.alreadyExisted ? HttpStatus.OK : HttpStatus.CREATED);
    return result;
  }
}

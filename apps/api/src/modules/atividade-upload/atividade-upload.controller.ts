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
  AtividadeUploadRequestContract,
  AtividadeUploadResponseContract,
} from '../../contracts/atividade-upload/atividade-upload.contract';
import { AppLogger } from '../../core/logger/app-logger';
import { GetUsuarioMobileId } from '../auth/modules/contract-permissions/decorators/get-usuario-mobile-id.decorator';
import {
  AtividadeUploadDto,
  AtividadeUploadResponseDto,
} from './dto/atividade-upload.dto';
import { UploadAtividadeUseCase } from './application/use-cases/upload-atividade.use-case';

@ApiTags('atividade-upload')
@ApiBearerAuth()
@Controller('mobile/uploads/activities')
export class AtividadeUploadController {
  constructor(
    private readonly uploadAtividadeUseCase: UploadAtividadeUseCase,
    private readonly logger: AppLogger,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Upload de atividade realizada',
    description:
      'Recebe execução da atividade (medidor, materiais, respostas, eventos e fotos inline) em um único payload JSON.',
  })
  @ApiBody({
    description: 'Payload da atividade realizada no app mobile',
    type: AtividadeUploadDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Atividade criada com sucesso',
    type: AtividadeUploadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Atividade já existia e foi atualizada (idempotência)',
    type: AtividadeUploadResponseDto,
  })
  async upload(
    @Body() body: AtividadeUploadDto,
    @GetUsuarioMobileId() userId: number | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AtividadeUploadResponseContract> {
    this.logger.info('Recebendo upload de atividade', {
      atividadeUuid: body.atividadeUuid,
      turnoId: body.turnoId,
    });

    const payload: AtividadeUploadRequestContract = body;
    const result = await this.uploadAtividadeUseCase.execute(payload, userId);

    res.status(result.alreadyExisted ? HttpStatus.OK : HttpStatus.CREATED);
    return result;
  }
}

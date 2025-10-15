/**
 * Controlador de Turnos para Mobile
 *
 * Este controlador gerencia exclusivamente os endpoints para o app móvel,
 * incluindo abertura de turno no formato específico enviado pelo mobile.
 */

import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Logger,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
import { GetUserContracts } from '@modules/engine/auth/decorators/get-user-contracts.decorator';
import { MobileAbrirTurnoDto } from '../dto';

/**
 * Controlador responsável pelas operações de turnos para mobile
 */
@ApiTags('turno')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('turno')
export class TurnoMobileController {
  private readonly logger = new Logger(TurnoMobileController.name);

  /**
   * Abre um novo turno via app móvel
   *
   * @param mobileDto - Dados do turno enviados pelo mobile
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Resposta indicando falha na abertura (conforme solicitado)
   */
  @Post('abrir')
  @ApiOperation({
    summary: 'Abre um novo turno via mobile',
    description: 'Endpoint específico para abertura de turno via app móvel - retorna falha temporariamente',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Falha na abertura de turno',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  async abrirTurnoMobile(
    @Body() mobileDto: MobileAbrirTurnoDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ) {
    this.logger.log(`Abertura de turno via mobile recebida:`, {
      turnoId: mobileDto.turno.idLocal,
      veiculoId: mobileDto.turno.veiculoId,
      equipeId: mobileDto.turno.equipeId,
      eletricistasCount: mobileDto.eletricistas?.length || 0,
      checklistsCount: mobileDto.checklists?.length || 0,
    });

    // Log detalhado dos dados recebidos para debug
    this.logger.debug('Dados completos recebidos:', JSON.stringify(mobileDto, null, 2));

    // Por enquanto, retorna erro conforme solicitado
    throw new HttpException(
      {
        message: 'Falha na abertura de turno',
        error: 'Turno não pôde ser aberto no momento',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        data: {
          turnoLocalId: mobileDto.turno.idLocal,
          timestamp: new Date().toISOString(),
        },
      },
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }
}

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
  BadRequestException,
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
import { MobileAbrirTurnoDto, ChecklistMobileDto } from '../dto';
import { TurnoService } from '../services/turno.service';
import { AbrirTurnoDto, EletricistaTurnoDto } from '../dto';

/**
 * Controlador responsável pelas operações de turnos para mobile
 */
@ApiTags('turno')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('turno')
export class TurnoMobileController {
  private readonly logger = new Logger(TurnoMobileController.name);

  constructor(private readonly turnoService: TurnoService) {}

  /**
   * Abre um novo turno via app móvel
   *
   * @param mobileDto - Dados do turno enviados pelo mobile
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Dados do turno aberto com sucesso
   */
  @Post('abrir')
  @ApiOperation({
    summary: 'Abre um novo turno via mobile',
    description:
      'Endpoint específico para abertura de turno via app móvel com fallback automático para eletricistaRemoteId',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Turno aberto com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou erro de validação',
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
    this.logger.debug(
      'Dados completos recebidos:',
      JSON.stringify(mobileDto, null, 2)
    );

    // Validar e aplicar fallback para eletricistaRemoteId nos checklists
    this.validateAndApplyEletricistaFallback(mobileDto);

    try {
      // Converter MobileAbrirTurnoDto para AbrirTurnoDto
      const abrirDto = this.converterParaAbrirTurnoDto(mobileDto);

      this.logger.log('Convertendo dados mobile para formato padrão da API');

      // Chamar o serviço real de abertura de turno
      const turnoResult = await this.turnoService.abrirTurno(
        abrirDto,
        allowedContracts
      );

      this.logger.log(`Turno aberto com sucesso: ID ${turnoResult.id}`);

      return {
        success: true,
        message: 'Turno aberto com sucesso',
        data: turnoResult,
        turnoLocalId: mobileDto.turno.idLocal,
        remoteId: turnoResult.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Erro ao abrir turno via mobile:', error);

      throw new HttpException(
        {
          message: 'Erro na abertura de turno',
          error: error.message || 'Erro inesperado',
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          data: {
            turnoLocalId: mobileDto.turno.idLocal,
            timestamp: new Date().toISOString(),
          },
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Valida e aplica fallback para eletricistaRemoteId nos checklists
   * Se um checklist não tiver eletricistaRemoteId, usa o primeiro eletricista do turno
   */
  private validateAndApplyEletricistaFallback(
    mobileDto: MobileAbrirTurnoDto
  ): void {
    if (!mobileDto.checklists || mobileDto.checklists.length === 0) {
      return;
    }

    if (!mobileDto.eletricistas || mobileDto.eletricistas.length === 0) {
      throw new BadRequestException(
        'Lista de eletricistas não pode estar vazia quando há checklists'
      );
    }

    // Pega o primeiro eletricista do turno como fallback
    const primeiroEletricista = mobileDto.eletricistas[0];

    if (!primeiroEletricista || !primeiroEletricista.remoteId) {
      throw new BadRequestException(
        'Primeiro eletricista deve ter ID remoto válido'
      );
    }

    // Aplica fallback para checklists sem eletricistaRemoteId válido
    mobileDto.checklists.forEach((checklist, index) => {
      const eletricistaId = checklist.eletricistaRemoteId;

      // Verifica se não tem eletricistaRemoteId ou se é inválido (null, undefined, -1, <= 0)
      if (!eletricistaId || eletricistaId <= 0) {
        this.logger.log(
          `Aplicando fallback: checklist[${index}] com eletricistaRemoteId inválido (${eletricistaId}), usando ${primeiroEletricista.remoteId}`
        );
        checklist.eletricistaRemoteId = primeiroEletricista.remoteId;
      }
    });

    this.logger.log(
      `Fallback aplicado. Total de checklists processados: ${mobileDto.checklists.length}`
    );
  }

  /**
   * Converte MobileAbrirTurnoDto para AbrirTurnoDto
   */
  private converterParaAbrirTurnoDto(
    mobileDto: MobileAbrirTurnoDto
  ): AbrirTurnoDto {
    // Converter eletricistas do formato mobile para formato padrão
    const eletricistas: EletricistaTurnoDto[] = mobileDto.eletricistas.map(
      elet => ({
        eletricistaId: elet.remoteId, // remoteId do mobile é o ID real do eletricista
      })
    );

    return {
      veiculoId: mobileDto.turno.veiculoId,
      equipeId: mobileDto.turno.equipeId,
      dispositivo: `mobile-${mobileDto.turno.idLocal || 'unknown'}`, // Gerar um ID de dispositivo baseado no ID local
      dataInicio: mobileDto.turno.horaInicio,
      kmInicio: mobileDto.turno.kmInicial,
      eletricistas: eletricistas,
    };
  }
}

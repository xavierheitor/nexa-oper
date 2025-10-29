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
  BadRequestException,
  UseInterceptors,
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
import {
  MobileAbrirTurnoDto,
  MobileFecharTurnoDto,
  MobileFecharTurnoResponseDto,
} from '../dto';
import { TurnoService } from '../services/turno.service';
import { AbrirTurnoDto, EletricistaTurnoDto, FecharTurnoDto } from '../dto';
import { parseMobileDate } from '@common/utils/date-timezone';
import {
  createStandardErrorResponse,
  handleValidationError,
} from '@common/utils/error-response';
import { ValidationErrorInterceptor } from '@common/interceptors/validation-error.interceptor';

/**
 * Controlador responsável pelas operações de turnos para mobile
 */
@ApiTags('turno')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ValidationErrorInterceptor)
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

      // Preparar resposta com informações de checklists se disponíveis
      const response: any = {
        success: true,
        message: 'Turno aberto com sucesso',
        data: turnoResult,
        turnoLocalId: mobileDto.turno.idLocal,
        remoteId: turnoResult.id,
        timestamp: new Date().toISOString(),
      };

      // Adicionar informações de checklists se disponíveis
      const checklistsSalvos = (turnoResult as any).checklistsSalvos;
      const pendenciasGeradas = (turnoResult as any).pendenciasGeradas;
      const respostasAguardandoFoto = (turnoResult as any)
        .respostasAguardandoFoto;

      if (checklistsSalvos !== undefined) {
        response.checklistsSalvos = checklistsSalvos;

        // Processamento assíncrono
        if ((turnoResult as any).processamentoAssincrono) {
          response.processamentoAssincrono = 'Em andamento';
        } else {
          // Dados síncronos (caso existam)
          response.pendenciasGeradas = pendenciasGeradas || 0;
          response.respostasAguardandoFoto = respostasAguardandoFoto || [];

          this.logger.log(
            `Checklists processados: ${response.checklistsSalvos} salvos, ${response.pendenciasGeradas || 0} pendências`
          );
        }
      }

      return response;
    } catch (error) {
      this.logger.error('Erro ao abrir turno via mobile:', error);

      // Usar padronização de erros
      if (error.status === HttpStatus.BAD_REQUEST && error.response?.message) {
        throw handleValidationError(error, '/api/turno/abrir');
      }

      // Para outros tipos de erro, usar resposta padronizada
      throw createStandardErrorResponse(
        error.message || 'Erro na abertura de turno',
        '/api/turno/abrir',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error.details
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

    // Converter checklists do formato mobile para formato padrão
    const checklists =
      mobileDto.checklists?.map(checklist => ({
        uuid: checklist.uuid, // ✅ UUID obrigatório
        checklistId: checklist.checklistModeloId,
        eletricistaId:
          checklist.eletricistaRemoteId || mobileDto.eletricistas[0].remoteId,
        dataPreenchimento: parseMobileDate(
          checklist.dataPreenchimento
        ).toISOString(),
        latitude: checklist.latitude,
        longitude: checklist.longitude,
        respostas:
          checklist.respostas?.map(resposta => ({
            ...resposta,
            dataResposta: parseMobileDate(resposta.dataResposta).toISOString(),
          })) || [],
      })) || [];

    return {
      veiculoId: mobileDto.turno.veiculoId,
      equipeId: mobileDto.turno.equipeId,
      dispositivo: mobileDto.turno.deviceId, // Usar o deviceId enviado pelo app
      dataInicio: parseMobileDate(mobileDto.turno.horaInicio).toISOString(),
      kmInicio: mobileDto.turno.kmInicial,
      eletricistas: eletricistas,
      checklists,
    };
  }

  /**
   * Fecha um turno via app móvel
   *
   * @param mobileDto - Dados do fechamento enviados pelo mobile
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Dados do turno fechado com sucesso
   */
  @Post('fechar')
  @ApiOperation({
    summary: 'Fecha um turno via mobile',
    description: 'Endpoint específico para fechamento de turno via app móvel',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Turno fechado com sucesso',
    type: MobileFecharTurnoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou erro de validação',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Turno não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  async fecharTurnoMobile(
    @Body() mobileDto: MobileFecharTurnoDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<MobileFecharTurnoResponseDto> {
    this.logger.log(`Fechamento de turno via mobile recebido:`, {
      turnoId: mobileDto.turnoId,
      kmFinal: mobileDto.kmFinal,
      horaFim: mobileDto.horaFim,
    });

    try {
      // Converter MobileFecharTurnoDto para FecharTurnoDto
      // Usar parseMobileDate para garantir interpretação correta do timezone
      const fecharDto: FecharTurnoDto = {
        turnoId: mobileDto.turnoId,
        kmFim: mobileDto.kmFinal,
        dataFim: parseMobileDate(mobileDto.horaFim).toISOString(),
      };

      this.logger.log('Convertendo dados mobile para formato padrão da API');

      // Chamar o serviço real de fechamento de turno
      const turnoResult = await this.turnoService.fecharTurno(
        fecharDto,
        allowedContracts
      );

      this.logger.log(`Turno fechado com sucesso: ID ${turnoResult.id}`);

      return {
        success: true,
        message: 'Turno fechado com sucesso',
        data: {
          id: turnoResult.id,
          dataSolicitacao: turnoResult.dataSolicitacao.toISOString(),
          dataInicio: turnoResult.dataInicio.toISOString(),
          dataFim: turnoResult.dataFim?.toISOString() || '',
          veiculoId: turnoResult.veiculoId,
          veiculoPlaca: turnoResult.veiculoPlaca,
          veiculoModelo: turnoResult.veiculoModelo,
          equipeId: turnoResult.equipeId,
          equipeNome: turnoResult.equipeNome,
          dispositivo: turnoResult.dispositivo,
          kmInicio: turnoResult.kmInicio,
          kmFim: turnoResult.kmFim || 0,
          status: turnoResult.status,
          eletricistas: turnoResult.eletricistas,
          createdAt: turnoResult.createdAt.toISOString(),
          createdBy: turnoResult.createdBy,
          updatedAt: turnoResult.updatedAt?.toISOString() || '',
          updatedBy: turnoResult.updatedBy || '',
          deletedAt: turnoResult.deletedAt?.toISOString() || null,
          deletedBy: turnoResult.deletedBy || null,
        },
        remoteId: turnoResult.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Erro ao fechar turno via mobile:', error);

      // Usar padronização de erros
      if (error.status === HttpStatus.BAD_REQUEST && error.response?.message) {
        throw handleValidationError(error, '/api/turno/fechar');
      }

      // Para outros tipos de erro, usar resposta padronizada
      throw createStandardErrorResponse(
        error.message || 'Erro no fechamento de turno',
        '/api/turno/fechar',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error.details
      );
    }
  }
}

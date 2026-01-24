/**
 * Controlador de Turnos para Mobile
 *
 * Este controlador gerencia exclusivamente os endpoints para o app móvel,
 * incluindo abertura de turno no formato específico enviado pelo mobile.
 */

import { ValidationErrorInterceptor } from '@common/interceptors/validation-error.interceptor';
import { parseMobileDate } from '@common/utils/date-timezone';
import {
  createStandardErrorResponse,
  handleValidationError,
} from '@common/utils/error-response';
import { GetUserContracts } from '@core/auth/decorators/get-user-contracts.decorator';
import { GetUsuarioMobileId } from '@core/auth/decorators/get-user-id-decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { ContractPermission } from '@core/auth/services/contract-permissions.service';
import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
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

import {
  MobileAbrirTurnoDto,
  MobileFecharTurnoDto,
  MobileFecharTurnoResponseDto,
} from '../dto';
import {
  AbrirTurnoDto,
  EletricistaTurnoDto,
  FecharTurnoDto,
  TurnoResponseDto,
} from '../dto';
import { TurnoService } from '../services/turno.service';

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
    @GetUsuarioMobileId() userId: string,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ) {
    this.logger.log(`Abertura de turno via mobile recebida:`, {
      turnoId: mobileDto.turno.idLocal,
      veiculoId: mobileDto.turno.veiculoId,
      equipeId: mobileDto.turno.equipeId,
      eletricistasCount: mobileDto.eletricistas?.length || 0,
      checklistsCount: mobileDto.checklists?.length || 0,
    });
    this.logger.debug(
      'Dados completos recebidos:',
      JSON.stringify(mobileDto, null, 2)
    );

    this.validateAndApplyEletricistaFallback(mobileDto);

    try {
      const abrirDto = this.converterParaAbrirTurnoDto(mobileDto);
      this.logger.log('Convertendo dados mobile para formato padrão da API');

      const turnoResult = await this.turnoService.abrirTurno(
        abrirDto,
        allowedContracts,
        userId
      );
      this.logger.log(`Turno aberto com sucesso: ID ${turnoResult.id}`);

      return this.buildAbrirTurnoResponse(mobileDto, turnoResult);
    } catch (error) {
      this.handleAbrirTurnoError(error);
    }
  }

  private buildAbrirTurnoResponse(
    mobileDto: MobileAbrirTurnoDto,
    turnoResult: unknown
  ): object {
    const t = turnoResult as Record<string, unknown> & { id: number };
    const response: Record<string, unknown> = {
      success: true,
      message: 'Turno aberto com sucesso',
      data: turnoResult,
      turnoLocalId: mobileDto.turno.idLocal,
      remoteId: t.id,
      timestamp: new Date().toISOString(),
    };
    const checklistsSalvos = t.checklistsSalvos as number | undefined;
    const pendenciasGeradas = t.pendenciasGeradas as number | undefined;
    const respostasAguardandoFoto = (t.respostasAguardandoFoto ??
      []) as unknown[];
    const processamentoAssincrono = t.processamentoAssincrono;

    if (checklistsSalvos !== undefined) {
      response.checklistsSalvos = checklistsSalvos;
      if (processamentoAssincrono) {
        response.processamentoAssincrono = 'Em andamento';
      } else {
        response.pendenciasGeradas = pendenciasGeradas ?? 0;
        response.respostasAguardandoFoto = respostasAguardandoFoto;
        this.logger.log(
          `Checklists processados: ${checklistsSalvos} salvos, ${pendenciasGeradas ?? 0} pendências`
        );
      }
    }
    return response;
  }

  private handleAbrirTurnoError(error: unknown): never {
    this.logger.error('Erro ao abrir turno via mobile:', error);
    const e = error as {
      status?: number;
      response?: { message?: unknown };
      message?: string;
      details?: unknown;
    };
    if (e.status === HttpStatus.BAD_REQUEST && e.response?.message) {
      throw handleValidationError(e, '/api/turno/abrir');
    }
    throw createStandardErrorResponse(
      e.message || 'Erro na abertura de turno',
      '/api/turno/abrir',
      e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      Array.isArray(e.details) ? (e.details as string[]) : undefined
    );
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
        motorista: elet.motorista || false, // Mapear campo motorista do mobile
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
          checklist.respostas && checklist.respostas.length > 0
            ? checklist.respostas.map(resposta => ({
                ...resposta,
                dataResposta: parseMobileDate(
                  resposta.dataResposta
                ).toISOString(),
              }))
            : [],
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
    status: HttpStatus.CONFLICT,
    description: 'Turno já está fechado - retorna dados para sincronização',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'already_closed',
        },
        remoteId: {
          type: 'number',
          example: 123,
        },
        closedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T17:00:00.000Z',
        },
        kmFinal: {
          type: 'number',
          nullable: true,
          example: 50120,
        },
      },
    },
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
      const fecharDto: FecharTurnoDto = {
        turnoId: mobileDto.turnoId,
        kmFim: mobileDto.kmFinal,
        dataFim: parseMobileDate(mobileDto.horaFim).toISOString(),
      };
      this.logger.log('Convertendo dados mobile para formato padrão da API');

      const turnoResult = await this.turnoService.fecharTurno(
        fecharDto,
        allowedContracts
      );

      this.throwIfAlreadyClosed(turnoResult);
      this.logger.log(`Turno fechado com sucesso: ID ${turnoResult.id}`);
      return this.buildFecharTurnoResponse(turnoResult);
    } catch (error) {
      this.handleFecharTurnoError(error);
    }
  }

  private throwIfAlreadyClosed(turnoResult: unknown): void {
    const t = turnoResult as Record<string, unknown> & {
      id: number;
      dataFim?: Date;
    };
    if (!t?._alreadyClosed) return;
    this.logger.log(`Turno já estava fechado: ID ${t.id}`);
    throw new HttpException(
      {
        status: 'already_closed',
        remoteId: t.id,
        closedAt: t.dataFim?.toISOString() ?? new Date().toISOString(),
        kmFinal: (t.KmFim as number | null | undefined) ?? null,
      },
      HttpStatus.CONFLICT
    );
  }

  private buildFecharTurnoResponse(
    turno: TurnoResponseDto
  ): MobileFecharTurnoResponseDto {
    return {
      success: true,
      message: 'Turno fechado com sucesso',
      data: {
        id: turno.id,
        dataSolicitacao: turno.dataSolicitacao.toISOString(),
        dataInicio: turno.dataInicio.toISOString(),
        dataFim: turno.dataFim?.toISOString() ?? '',
        veiculoId: turno.veiculoId,
        veiculoPlaca: turno.veiculoPlaca,
        veiculoModelo: turno.veiculoModelo,
        equipeId: turno.equipeId,
        equipeNome: turno.equipeNome,
        dispositivo: turno.dispositivo ?? '',
        kmInicio: turno.kmInicio,
        kmFim: turno.kmFim ?? 0,
        status: turno.status,
        eletricistas: turno.eletricistas ?? [],
        createdAt: turno.createdAt.toISOString(),
        createdBy: turno.createdBy,
        updatedAt: turno.updatedAt?.toISOString() ?? '',
        updatedBy: turno.updatedBy ?? '',
        deletedAt: turno.deletedAt?.toISOString() ?? null,
        deletedBy: turno.deletedBy ?? null,
      },
      remoteId: turno.id,
      timestamp: new Date().toISOString(),
    };
  }

  private handleFecharTurnoError(error: unknown): never {
    if (error instanceof HttpException && error.getStatus() === 409) {
      throw error;
    }
    this.logger.error('Erro ao fechar turno via mobile:', error);
    const e = error as {
      status?: number;
      response?: { message?: unknown };
      message?: string;
      details?: unknown;
    };
    if (e.status === HttpStatus.BAD_REQUEST && e.response?.message) {
      throw handleValidationError(e, '/api/turno/fechar');
    }
    throw createStandardErrorResponse(
      e.message ?? 'Erro no fechamento de turno',
      '/api/turno/fechar',
      e.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      Array.isArray(e.details) ? (e.details as string[]) : undefined
    );
  }
}

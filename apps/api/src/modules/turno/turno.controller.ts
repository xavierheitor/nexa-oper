import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {
  AbrirTurnoRequestContract,
  AbrirTurnoResponseContract,
} from '../../contracts/turno/abrir-turno.contract';
import {
  FecharTurnoRequestContract,
  ListTurnosResponseContract,
  SyncTurnosInputContract,
  TurnoDetalheContract,
  TurnoQueryContract,
  TurnoSummaryContract,
} from '../../contracts/turno/turno.contract';
import {
  envelopeData,
  type EnvelopePayload,
} from '../../core/http/interceptors';
import { AppError } from '../../core/errors/app-error';
import { AbrirTurnoDto } from './dto/abrir-turno.dto';
import { FecharTurnoDto, FecharTurnoPostDto } from './dto/fechar-turno.dto';
import { TurnoQueryDto } from './dto/turno-query.dto';
import { AbrirTurnoResponseDto } from './dto/abrir-turno-response.dto';
import { ListTurnosResponseDto } from './dto/list-turnos-response.dto';
import { TurnoResponseDto } from './dto/turno-response.dto';
import { TurnoDetalheDto } from './dto/turno-detalhe.dto';
import { OpenTurnoUseCase } from './application/use-cases/open-turno.use-case';
import { CloseTurnoUseCase } from './application/use-cases/close-turno.use-case';
import { ListTurnosUseCase } from './application/use-cases/list-turnos.use-case';
import { GetTurnoUseCase } from './application/use-cases/get-turno.use-case';
import { SyncTurnosUseCase } from './application/use-cases/sync-turnos.use-case';

/**
 * Controller responsável pelo gerenciamento de turnos.
 *
 * Permite abrir e fechar turnos, listar turnos com filtros e obter detalhes.
 * Também oferece endpoint de sincronização para o mobile.
 */
@ApiTags('turno')
@ApiBearerAuth()
@Controller('turno')
export class TurnoController {
  constructor(
    private readonly openTurnoUseCase: OpenTurnoUseCase,
    private readonly closeTurnoUseCase: CloseTurnoUseCase,
    private readonly listTurnosUseCase: ListTurnosUseCase,
    private readonly getTurnoUseCase: GetTurnoUseCase,
    private readonly syncTurnosUseCase: SyncTurnosUseCase,
  ) {}

  /**
   * Abre um novo turno.
   *
   * O payload inclui dados do veículo, equipe, eletricistas e checklists preenchidos.
   * Retorna os dados do turno criado e status do processamento assíncrono de checklists.
   *
   * @param dto - Dados para abertura do turno.
   * @returns Resposta envelope com os dados do turno.
   */
  @Post('abrir')
  @ApiOperation({ summary: 'Abrir turno' })
  @ApiOkResponse({
    description:
      'Turno aberto. Resposta em envelope: { success, data: AbrirTurnoResponseDto, message? }',
    type: AbrirTurnoResponseDto,
  })
  async abrirTurno(
    @Body() dto: AbrirTurnoDto,
  ): Promise<EnvelopePayload<AbrirTurnoResponseContract>> {
    const input: AbrirTurnoRequestContract = dto;
    const data = await this.openTurnoUseCase.execute(input);

    const _swaggerData: AbrirTurnoResponseDto = data;
    void _swaggerData;

    return envelopeData(data, { message: 'Turno aberto com sucesso' });
  }

  /**
   * Fecha um turno existente.
   *
   * Endpoint de compatibilidade mobile (recebe turnoId no corpo).
   *
   * @param dto - Dados para fechamento (turnoId, kmFim, dataFim).
   * @returns Resposta envelope com os dados do turno fechado.
   */
  @Post('fechar')
  @ApiOperation({ summary: 'Fechar turno (compatibilidade mobile)' })
  @ApiOkResponse({
    description:
      'Turno fechado. Resposta em envelope: { success, data: TurnoResponseDto, message? }',
    type: TurnoResponseDto,
  })
  async fecharTurno(@Body() dto: FecharTurnoPostDto) {
    const input: FecharTurnoRequestContract = dto;
    const turno = await this.closeTurnoUseCase.execute(input);
    return envelopeData(turno, { message: 'Turno fechado com sucesso' });
  }

  /**
   * Fecha um turno pelo ID na URL.
   *
   * Alternativa RESTful para fechar turno.
   *
   * @param id - ID do turno.
   * @param dto - Dados para fechamento (kmFim, dataFim).
   * @returns Dados do turno fechado.
   */
  @Patch(':id/fechar')
  @ApiOperation({ summary: 'Fechar turno por ID na rota' })
  @ApiOkResponse({
    description:
      'Turno fechado. Resposta em envelope: { success, data: TurnoResponseDto }',
    type: TurnoResponseDto,
  })
  async fecharTurnoById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FecharTurnoDto,
  ): Promise<TurnoSummaryContract> {
    return this.closeTurnoUseCase.execute({ ...dto, turnoId: id });
  }

  /**
   * Sincroniza turnos para o dispositivo mobile.
   *
   * Retorna turnos que foram criados ou modificados desde a data `since`.
   *
   * @param since - Data ISO do último sync.
   * @param limit - Limite de registros.
   * @returns Lista de turnos com detalhes.
   */
  @Get('sync')
  @ApiOperation({ summary: 'Sincronizar turnos (mobile)' })
  @ApiOkResponse({
    description:
      'Lista de turnos para sync. Resposta em envelope: { success, data: TurnoDetalheDto[] }',
    type: [TurnoDetalheDto],
  })
  async sync(
    @Query('since') since?: string,
    @Query('limit') limit?: string,
  ): Promise<TurnoDetalheContract[]> {
    const sinceDate = since ? new Date(since) : undefined;
    if (sinceDate && Number.isNaN(sinceDate.getTime())) {
      throw AppError.validation('Parâmetro since inválido');
    }

    const parsedLimit = limit != null ? parseInt(limit, 10) : undefined;
    if (
      parsedLimit != null &&
      (!Number.isInteger(parsedLimit) || parsedLimit <= 0)
    ) {
      throw AppError.validation('Parâmetro limit inválido');
    }

    const input: SyncTurnosInputContract = {
      since: sinceDate,
      limit: parsedLimit,
    };
    return this.syncTurnosUseCase.execute(input);
  }

  /**
   * Lista turnos com paginação e filtros.
   *
   * Filtros suportados: status, datas, equipe, veículo, eletricista, busca textual.
   *
   * @param query - DTO com parâmetros de filtro e paginação.
   * @returns Lista paginada de turnos.
   */
  @Get()
  @ApiOperation({ summary: 'Listar turnos' })
  @ApiOkResponse({
    description:
      'Lista paginada. Resposta em envelope: { success, data: ListTurnosResponseDto }',
    type: ListTurnosResponseDto,
  })
  async listarTurnos(
    @Query() query: TurnoQueryDto,
  ): Promise<ListTurnosResponseContract> {
    const input: TurnoQueryContract = query;
    return this.listTurnosUseCase.execute(input);
  }

  /**
   * Obtém os detalhes completos de um turno pelo ID.
   *
   * Inclui checklists, eletricistas e registros de turno realizado.
   *
   * @param id - ID do turno.
   * @returns Detalhes do turno.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhe do turno' })
  @ApiOkResponse({
    description:
      'Detalhe do turno. Resposta em envelope: { success, data: TurnoDetalheDto }',
    type: TurnoDetalheDto,
  })
  async obterTurno(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TurnoDetalheContract> {
    return this.getTurnoUseCase.execute(id);
  }
}

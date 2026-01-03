import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TurnoRealizadoService } from './turno-realizado.service';
import type { AbrirTurnoPayload } from './turno-realizado.service';
import { ConsolidadoEletricistaQueryDto } from './dto/consolidado-eletricista-query.dto';
import { ConsolidadoEquipeQueryDto } from './dto/consolidado-equipe-query.dto';
import { FaltaFilterDto } from './dto/falta-filter.dto';
import { HoraExtraFilterDto } from './dto/hora-extra-filter.dto';
import { AprovarHoraExtraDto } from './dto/aprovar-hora-extra.dto';
import { LocalhostCorsGuard } from './guards/localhost-cors.guard';

@ApiTags('turnos-realizados')
@Controller('turnos-realizados')
export class TurnoRealizadoController {
  constructor(
    private readonly service: TurnoRealizadoService,
  ) {}

  @Post('aberturas')
  @ApiOperation({ summary: 'Abrir um novo turno realizado' })
  async abrir(@Body() body: AbrirTurnoPayload) {
    // Observação: validação DTO/Zod a ser adicionada conforme padrões do projeto
    const exec = body.executadoPor ?? 'system';
    return await this.service.abrirTurno({ ...body, executadoPor: exec });
  }

  @Post(':turnoId/fechamento')
  @ApiOperation({ summary: 'Fechar um turno realizado' })
  async fechar(
    @Param('turnoId', ParseIntPipe) turnoId: number,
    @Body('executadoPor') executadoPor: string,
  ) {
    const exec = executadoPor ?? 'system';
    return await this.service.fecharTurno(turnoId, exec);
  }

  @Get('resumo')
  @ApiOperation({ summary: 'Resumo de turnos (endpoint legado)' })
  async resumo(@Query('data') data: string, @Query('equipe') equipe: string) {
    return this.service.resumo({ data, equipeId: Number(equipe) });
  }

  @Get('consolidado/eletricista/:eletricistaId')
  @ApiOperation({
    summary: 'Obter dados consolidados de frequência de um eletricista',
    description:
      'Retorna dados consolidados de frequência (dias trabalhados, faltas, horas extras) de um eletricista em um período',
  })
  @ApiResponse({ status: 200, description: 'Dados consolidados retornados com sucesso' })
  @ApiResponse({ status: 404, description: 'Eletricista não encontrado' })
  async getConsolidadoEletricista(
    @Param('eletricistaId', ParseIntPipe) eletricistaId: number,
    @Query() query: ConsolidadoEletricistaQueryDto,
  ) {
    return this.service.getConsolidadoEletricista(eletricistaId, {
      ...query,
      eletricistaId,
    });
  }

  @Get('consolidado/equipe/:equipeId')
  @ApiOperation({
    summary: 'Obter dados consolidados de frequência de uma equipe',
    description:
      'Retorna dados consolidados de frequência de todos os eletricistas de uma equipe em um período',
  })
  @ApiResponse({ status: 200, description: 'Dados consolidados retornados com sucesso' })
  @ApiResponse({ status: 404, description: 'Equipe não encontrada' })
  async getConsolidadoEquipe(
    @Param('equipeId', ParseIntPipe) equipeId: number,
    @Query() query: ConsolidadoEquipeQueryDto,
  ) {
    return this.service.getConsolidadoEquipe(equipeId, {
      ...query,
      equipeId,
    });
  }

  @Get('aderencia/equipe/:equipeId')
  @ApiOperation({
    summary: 'Obter aderência de equipe (percentual de execução da escala)',
    description:
      'Retorna percentual de aderência da equipe à escala planejada, incluindo dias abertos, justificativas e detalhamento diário',
  })
  @ApiResponse({ status: 200, description: 'Aderência retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'Equipe não encontrada' })
  async getAderenciaEquipe(
    @Param('equipeId', ParseIntPipe) equipeId: number,
    @Query() query: ConsolidadoEquipeQueryDto,
  ) {
    return this.service.getAderenciaEquipe(equipeId, query);
  }

  @Get('faltas')
  @ApiOperation({
    summary: 'Listar faltas com filtros',
    description: 'Retorna lista paginada de faltas com filtros opcionais',
  })
  @ApiResponse({ status: 200, description: 'Lista de faltas retornada com sucesso' })
  async listFaltas(@Query() filtros: FaltaFilterDto) {
    return this.service.listFaltas(filtros);
  }

  @Get('horas-extras')
  @ApiOperation({
    summary: 'Listar horas extras com filtros',
    description: 'Retorna lista paginada de horas extras com filtros opcionais',
  })
  @ApiResponse({ status: 200, description: 'Lista de horas extras retornada com sucesso' })
  async listHorasExtras(@Query() filtros: HoraExtraFilterDto) {
    return this.service.listHorasExtras(filtros);
  }

  @Patch('horas-extras/:id/aprovacao')
  @ApiOperation({
    summary: 'Aprovar ou rejeitar uma hora extra',
    description: 'Aprova ou rejeita uma hora extra pendente',
  })
  @ApiResponse({ status: 200, description: 'Hora extra atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Hora extra não encontrada' })
  async aprovarHoraExtra(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AprovarHoraExtraDto,
    @Body('executadoPor') executadoPor: string,
  ) {
    const exec = executadoPor || 'system';
    return this.service.aprovarHoraExtra(id, dto, exec);
  }

}



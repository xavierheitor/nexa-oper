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
import { ReconciliarManualDto } from './dto/reconciliar-manual.dto';
import { LocalhostCorsGuard } from './guards/localhost-cors.guard';
import { TurnoReconciliacaoService } from './turno-reconciliacao.service';
import { DatabaseService } from '../../database/database.service';

@ApiTags('turnos-realizados')
@Controller('turnos-realizados')
export class TurnoRealizadoController {
  constructor(
    private readonly service: TurnoRealizadoService,
    private readonly reconciliacaoService: TurnoReconciliacaoService,
    private readonly db: DatabaseService,
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

  @Post('reconciliacao/manual')
  @UseGuards(LocalhostCorsGuard)
  @ApiOperation({
    summary: 'Executar reconciliação manual (apenas localhost)',
    description:
      'Executa reconciliação manual de turnos para uma equipe e data específica, ou para todas as equipes com escala publicada. ' +
      'Este endpoint só pode ser acessado de localhost por questões de segurança.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reconciliação executada com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas localhost permitido',
  })
  async reconciliarManual(@Body() dto: ReconciliarManualDto) {
    const prisma = this.db.getPrisma();
    const dataRef = new Date(dto.dataReferencia);
    const dataRefInicio = new Date(dataRef);
    dataRefInicio.setHours(0, 0, 0, 0);
    const dataRefFim = new Date(dataRef);
    dataRefFim.setHours(23, 59, 59, 999);

    let equipesIds: number[] = [];

    if (dto.todasEquipes) {
      // Buscar todas as equipes que têm escala publicada na data especificada
      const escalasPublicadas = await prisma.escalaEquipePeriodo.findMany({
        where: {
          status: 'PUBLICADA',
          periodoInicio: { lte: dataRefFim },
          periodoFim: { gte: dataRefInicio },
        },
        select: {
          equipeId: true,
        },
        distinct: ['equipeId'],
      });

      equipesIds = escalasPublicadas.map((e) => e.equipeId);

      if (equipesIds.length === 0) {
        return {
          success: false,
          message: 'Nenhuma equipe com escala publicada encontrada para a data especificada',
          dataReferencia: dto.dataReferencia,
          equipesProcessadas: 0,
          resultados: [],
        };
      }
    } else {
      if (!dto.equipeId) {
        throw new Error('equipeId é obrigatório quando todasEquipes não é true');
      }
      equipesIds = [dto.equipeId];
    }

    // Executar reconciliação para cada equipe
    const resultados: Array<{
      equipeId: number;
      success: boolean;
      message?: string;
      error?: string;
    }> = [];

    for (const equipeId of equipesIds) {
      try {
        await this.reconciliacaoService.reconciliarDiaEquipe({
          dataReferencia: dto.dataReferencia,
          equipePrevistaId: equipeId,
          executadoPor: 'manual-reconciliation',
        });

        resultados.push({
          equipeId,
          success: true,
          message: `Reconciliação executada com sucesso`,
        });
      } catch (error: any) {
        resultados.push({
          equipeId,
          success: false,
          error: error.message || 'Erro desconhecido',
        });
      }
    }

    const sucessos = resultados.filter((r) => r.success).length;
    const erros = resultados.filter((r) => !r.success).length;

    return {
      success: erros === 0,
      message: dto.todasEquipes
        ? `Reconciliação executada para ${sucessos} equipe(s). ${erros > 0 ? `${erros} erro(s).` : ''}`
        : `Reconciliação executada para equipe ${dto.equipeId} em ${dto.dataReferencia}`,
      dataReferencia: dto.dataReferencia,
      equipesProcessadas: equipesIds.length,
      sucessos,
      erros,
      resultados,
    };
  }
}



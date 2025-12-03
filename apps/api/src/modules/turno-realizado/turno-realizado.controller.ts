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
import { ReconciliarForcadoDto } from './dto/reconciliar-forcado.dto';
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

  @Post('reconciliacao/forcado')
  @UseGuards(LocalhostCorsGuard)
  @ApiOperation({
    summary: 'Verificar e reconciliar forçadamente tudo que falta (apenas localhost)',
    description:
      'Busca no banco todos os dias/equipes que têm slots de escala publicada mas ainda não foram reconciliados ' +
      'e executa a reconciliação forçada ignorando a margem de 30 minutos. ' +
      'Este endpoint só pode ser acessado de localhost por questões de segurança.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificação e reconciliação executadas com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas localhost permitido',
  })
  async reconciliarForcado(@Body() dto: ReconciliarForcadoDto) {
    const prisma = this.db.getPrisma();
    const agora = new Date();

    // Calcular período
    let dataInicio: Date;
    let dataFim: Date;

    if (dto.dataInicio && dto.dataFim) {
      dataInicio = new Date(dto.dataInicio);
      dataFim = new Date(dto.dataFim);
    } else {
      const diasHistorico = dto.diasHistorico || 30;
      dataFim = new Date(agora);
      dataFim.setHours(23, 59, 59, 999);
      dataInicio = new Date(agora);
      dataInicio.setDate(dataInicio.getDate() - diasHistorico);
      dataInicio.setHours(0, 0, 0, 0);
    }

    dataInicio.setHours(0, 0, 0, 0);
    dataFim.setHours(23, 59, 59, 999);

    // Buscar todas as equipes que têm escala publicada no período
    const equipesComEscala = await prisma.escalaEquipePeriodo.findMany({
      where: {
        status: 'PUBLICADA',
        periodoInicio: { lte: dataFim },
        periodoFim: { gte: dataInicio },
      },
      select: {
        equipeId: true,
      },
      distinct: ['equipeId'],
    });

    const equipesIds = equipesComEscala.map((e) => e.equipeId);

    if (equipesIds.length === 0) {
      return {
        success: false,
        message: 'Nenhuma equipe com escala publicada encontrada no período especificado',
        periodo: {
          dataInicio: dataInicio.toISOString().split('T')[0],
          dataFim: dataFim.toISOString().split('T')[0],
        },
        equipesProcessadas: 0,
        diasProcessados: 0,
        resultados: [],
      };
    }

    // Coletar todos os dias/equipes que precisam ser reconciliados
    const pendentes: Array<{ equipeId: number; data: string }> = [];

    for (const equipeId of equipesIds) {
      const dataAtual = new Date(dataInicio);
      while (dataAtual <= dataFim) {
        const dataStr = dataAtual.toISOString().split('T')[0];
        const dataRefInicio = new Date(dataAtual);
        dataRefInicio.setHours(0, 0, 0, 0);
        const dataRefFim = new Date(dataAtual);
        dataRefFim.setHours(23, 59, 59, 999);

        // Verificar se há slots de escala neste dia para esta equipe
        const slotsNoDia = await prisma.slotEscala.findFirst({
          where: {
            data: {
              gte: dataRefInicio,
              lte: dataRefFim,
            },
            escalaEquipePeriodo: {
              equipeId,
              status: 'PUBLICADA',
            },
          },
          select: { id: true },
        });

        if (slotsNoDia) {
          pendentes.push({ equipeId, data: dataStr });
        }

        // Avançar para próximo dia
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
    }

    // Executar reconciliação forçada para cada dia/equipe pendente
    const resultados: Array<{
      equipeId: number;
      data: string;
      success: boolean;
      message?: string;
      error?: string;
    }> = [];

    for (const pendente of pendentes) {
      try {
        await this.reconciliacaoService.reconciliarDiaEquipe({
          dataReferencia: pendente.data,
          equipePrevistaId: pendente.equipeId,
          executadoPor: 'forced-reconciliation',
        });

        resultados.push({
          equipeId: pendente.equipeId,
          data: pendente.data,
          success: true,
          message: 'Reconciliação executada com sucesso',
        });
      } catch (error: any) {
        resultados.push({
          equipeId: pendente.equipeId,
          data: pendente.data,
          success: false,
          error: error.message || 'Erro desconhecido',
        });
      }
    }

    const sucessos = resultados.filter((r) => r.success).length;
    const erros = resultados.filter((r) => !r.success).length;

    return {
      success: erros === 0,
      message: `Reconciliação forçada executada: ${sucessos} sucesso(s), ${erros} erro(s)`,
      periodo: {
        dataInicio: dataInicio.toISOString().split('T')[0],
        dataFim: dataFim.toISOString().split('T')[0],
      },
      equipesProcessadas: equipesIds.length,
      diasProcessados: pendentes.length,
      sucessos,
      erros,
      resultados,
    };
  }
}



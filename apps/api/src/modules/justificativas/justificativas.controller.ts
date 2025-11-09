import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JustificativasService } from './justificativas.service';

@ApiTags('justificativas')
@Controller()
export class JustificativasController {
  constructor(private readonly service: JustificativasService) {}

  // Tipos de Justificativa
  @Get('tipos-justificativa')
  @ApiOperation({
    summary: 'Listar tipos de justificativa',
    description: 'Retorna todos os tipos de justificativa ativos para uso em formulários',
  })
  @ApiResponse({ status: 200, description: 'Lista de tipos retornada com sucesso' })
  async listarTipos() {
    return this.service.listarTipos();
  }

  @Post('tipos-justificativa')
  @ApiOperation({
    summary: 'Criar tipo de justificativa',
    description: 'Cria um novo tipo de justificativa (usado no web para CRUD)',
  })
  @ApiResponse({ status: 201, description: 'Tipo criado com sucesso' })
  async criarTipo(
    @Body()
    body: {
      nome: string;
      descricao?: string;
      ativo?: boolean;
      geraFalta?: boolean;
      createdBy?: string;
    },
  ) {
    return this.service.criarTipo({
      nome: body.nome,
      descricao: body.descricao,
      ativo: body.ativo ?? true,
      geraFalta: body.geraFalta ?? true,
      createdBy: body.createdBy ?? 'system',
    });
  }

  @Put('tipos-justificativa/:id')
  @ApiOperation({
    summary: 'Atualizar tipo de justificativa',
    description: 'Atualiza um tipo de justificativa existente',
  })
  @ApiResponse({ status: 200, description: 'Tipo atualizado com sucesso' })
  async atualizarTipo(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      nome?: string;
      descricao?: string;
      ativo?: boolean;
      geraFalta?: boolean;
      updatedBy?: string;
    },
  ) {
    return this.service.atualizarTipo(id, {
      nome: body.nome,
      descricao: body.descricao,
      ativo: body.ativo,
      geraFalta: body.geraFalta,
      updatedBy: body.updatedBy ?? 'system',
    });
  }

  // Justificativas individuais (para faltas)
  @Post('faltas/:faltaId/justificativas')
  @ApiOperation({ summary: 'Criar justificativa para uma falta' })
  async criar(
    @Param('faltaId', ParseIntPipe) faltaId: number,
    @Body()
    body: { tipoId: number; descricao?: string; createdBy?: string },
  ) {
    return this.service.criarJustificativa({
      faltaId,
      tipoId: body.tipoId,
      descricao: body.descricao,
      createdBy: body.createdBy ?? 'system',
    });
  }

  @Post('justificativas/:id/aprovar')
  @ApiOperation({ summary: 'Aprovar justificativa individual' })
  async aprovar(
    @Param('id', ParseIntPipe) id: number,
    @Body('decididoPor') decididoPor?: string,
  ) {
    return this.service.aprovarJustificativa(id, decididoPor ?? 'system');
  }

  @Post('justificativas/:id/rejeitar')
  @ApiOperation({ summary: 'Rejeitar justificativa individual' })
  async rejeitar(
    @Param('id', ParseIntPipe) id: number,
    @Body('decididoPor') decididoPor?: string,
  ) {
    return this.service.rejeitarJustificativa(id, decididoPor ?? 'system');
  }

  // Justificativas de Equipe
  @Post('equipes/:equipeId/justificativas')
  @ApiOperation({
    summary: 'Criar justificativa para equipe que não abriu turno',
    description:
      'Cria justificativa quando equipe não abriu turno (ex: veículo quebrado, falta de reposição)',
  })
  @ApiResponse({ status: 201, description: 'Justificativa criada com sucesso' })
  async criarJustificativaEquipe(
    @Param('equipeId', ParseIntPipe) equipeId: number,
    @Body()
    body: {
      dataReferencia: string;
      tipoJustificativaId: number;
      descricao?: string;
      createdBy?: string;
    },
  ) {
    return this.service.criarJustificativaEquipe({
      equipeId,
      dataReferencia: body.dataReferencia,
      tipoJustificativaId: body.tipoJustificativaId,
      descricao: body.descricao,
      createdBy: body.createdBy ?? 'system',
    });
  }

  @Post('justificativas-equipe/:id/aprovar')
  @ApiOperation({
    summary: 'Aprovar justificativa de equipe',
    description:
      'Se aprovada e não gera falta, remove faltas pendentes dos eletricistas da equipe',
  })
  async aprovarJustificativaEquipe(
    @Param('id', ParseIntPipe) id: number,
    @Body('decididoPor') decididoPor?: string,
  ) {
    await this.service.aprovarJustificativaEquipe(
      id,
      decididoPor ?? 'system',
    );
    return { success: true, message: 'Justificativa aprovada' };
  }

  @Post('justificativas-equipe/:id/rejeitar')
  @ApiOperation({ summary: 'Rejeitar justificativa de equipe' })
  async rejeitarJustificativaEquipe(
    @Param('id', ParseIntPipe) id: number,
    @Body('decididoPor') decididoPor?: string,
  ) {
    return this.service.rejeitarJustificativaEquipe(
      id,
      decididoPor ?? 'system',
    );
  }

  @Get('justificativas-equipe')
  @ApiOperation({ summary: 'Listar justificativas de equipe' })
  async listarJustificativasEquipe(
    @Query('equipeId') equipeId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listarJustificativasEquipe({
      equipeId: equipeId ? parseInt(equipeId, 10) : undefined,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      status,
    });
  }
}



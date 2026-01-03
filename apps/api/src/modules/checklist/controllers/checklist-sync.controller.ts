/**
 * Controlador de Sincronização de Checklists
 *
 * Este controlador gerencia exclusivamente os endpoints de sincronização
 * para clientes mobile, fornecendo dados completos sem paginação.
 *
 * RESPONSABILIDADES:
 * - Gerenciar endpoints de sincronização de checklists
 * - Fornecer dados completos para mobile
 * - Documentar APIs via Swagger
 * - Tratar erros de forma padronizada
 * - Garantir logging estruturado
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/checklist/sync/modelos - Sincronizar checklists
 * - GET /api/checklist/sync/perguntas - Sincronizar perguntas
 * - GET /api/checklist/sync/perguntas/relacoes - Sincronizar relações Checklist-Perguntas
 * - GET /api/checklist/sync/opcoes-resposta - Sincronizar opções de resposta
 * - GET /api/checklist/sync/opcoes-resposta/relacoes - Sincronizar relações Checklist-Opções
 * - GET /api/checklist/sync/tipos-veiculo/relacoes - Sincronizar relações Checklist-TipoVeículo
 * - GET /api/checklist/sync/tipos-equipe/relacoes - Sincronizar relações Checklist-TipoEquipe
 */

import { SyncAuditRemoverInterceptor } from '@common/interceptors';
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  ChecklistOpcaoRespostaRelacaoSyncDto,
  ChecklistOpcaoRespostaSyncDto,
  ChecklistPerguntaRelacaoSyncDto,
  ChecklistPerguntaSyncDto,
  ChecklistResponseDto,
  ChecklistTipoEquipeRelacaoSyncDto,
  ChecklistTipoVeiculoRelacaoSyncDto,
} from '../dto';
import { ChecklistService } from '../services/checklist.service';

/**
 * Controlador de Sincronização de Checklists
 */
@ApiTags('checklist-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(SyncAuditRemoverInterceptor)
@Controller('checklist/sync')
export class ChecklistSyncController {
  private readonly logger = new Logger(ChecklistSyncController.name);

  constructor(private readonly checklistService: ChecklistService) {}

  /**
   * Retorna todos os checklists para sincronização mobile
   */
  @Get('modelos')
  @ApiOperation({
    summary: 'Sincronizar checklists',
    description:
      'Retorna todos os checklists ativos sem paginação para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de checklists retornada com sucesso',
    type: [ChecklistResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncModelos(): Promise<ChecklistResponseDto[]> {
    this.logger.log('Iniciando sincronização de checklists');
    return this.checklistService.findAllForSync();
  }

  /**
   * Retorna todas as perguntas de checklist para sincronização mobile
   */
  @Get('perguntas')
  @ApiOperation({
    summary: 'Sincronizar perguntas de checklist',
    description:
      'Retorna todas as perguntas de checklist ativas para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de perguntas retornada com sucesso',
    type: [ChecklistPerguntaSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncPerguntas(): Promise<ChecklistPerguntaSyncDto[]> {
    this.logger.log('Iniciando sincronização de perguntas de checklist');
    return this.checklistService.findAllPerguntasForSync();
  }

  /**
   * Retorna todas as relações checklist-perguntas para sincronização mobile
   */
  @Get('perguntas/relacoes')
  @ApiOperation({
    summary: 'Sincronizar relações Checklist-Perguntas',
    description:
      'Retorna todas as relações entre checklists e perguntas para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de relações retornada com sucesso',
    type: [ChecklistPerguntaRelacaoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncPerguntaRelacoes(): Promise<ChecklistPerguntaRelacaoSyncDto[]> {
    this.logger.log('Iniciando sincronização de relações Checklist-Perguntas');
    return this.checklistService.findAllPerguntaRelacoesForSync();
  }

  /**
   * Retorna todas as opções de resposta de checklist para sincronização mobile
   */
  @Get('opcoes-resposta')
  @ApiOperation({
    summary: 'Sincronizar opções de resposta de checklist',
    description:
      'Retorna todas as opções de resposta de checklist ativas para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de opções retornada com sucesso',
    type: [ChecklistOpcaoRespostaSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncOpcoes(): Promise<ChecklistOpcaoRespostaSyncDto[]> {
    this.logger.log(
      'Iniciando sincronização de opções de resposta de checklist'
    );
    return this.checklistService.findAllOpcoesForSync();
  }

  /**
   * Retorna todas as relações checklist-opções para sincronização mobile
   */
  @Get('opcoes-resposta/relacoes')
  @ApiOperation({
    summary: 'Sincronizar relações Checklist-Opções',
    description:
      'Retorna todas as relações entre checklists e opções de resposta para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de relações retornada com sucesso',
    type: [ChecklistOpcaoRespostaRelacaoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncOpcaoRelacoes(): Promise<ChecklistOpcaoRespostaRelacaoSyncDto[]> {
    this.logger.log('Iniciando sincronização de relações Checklist-Opções');
    return this.checklistService.findAllOpcaoRelacoesForSync();
  }

  /**
   * Retorna todas as relações checklist-tipo de veículo para sincronização mobile
   */
  @Get('tipos-veiculo/relacoes')
  @ApiOperation({
    summary: 'Sincronizar relações Checklist-Tipo de Veículo',
    description:
      'Retorna todas as relações entre checklists e tipos de veículo para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de relações retornada com sucesso',
    type: [ChecklistTipoVeiculoRelacaoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncTipoVeiculoRelacoes(): Promise<
    ChecklistTipoVeiculoRelacaoSyncDto[]
  > {
    this.logger.log(
      'Iniciando sincronização de relações Checklist-Tipo de Veículo'
    );
    return this.checklistService.findAllTipoVeiculoRelacoesForSync();
  }

  /**
   * Retorna todas as relações checklist-tipo de equipe para sincronização mobile
   */
  @Get('tipos-equipe/relacoes')
  @ApiOperation({
    summary: 'Sincronizar relações Checklist-Tipo de Equipe',
    description:
      'Retorna todas as relações entre checklists e tipos de equipe para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de relações retornada com sucesso',
    type: [ChecklistTipoEquipeRelacaoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncTipoEquipeRelacoes(): Promise<ChecklistTipoEquipeRelacaoSyncDto[]> {
    this.logger.log(
      'Iniciando sincronização de relações Checklist-Tipo de Equipe'
    );
    return this.checklistService.findAllTipoEquipeRelacoesForSync();
  }
}

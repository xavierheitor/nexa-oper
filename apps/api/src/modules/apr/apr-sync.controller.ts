/**
 * Controlador de Sincronização APR (Análise Preliminar de Risco)
 *
 * Este controlador gerencia exclusivamente os endpoints de sincronização
 * para clientes mobile, fornecendo dados completos sem paginação.
 *
 * RESPONSABILIDADES:
 * - Gerenciar endpoints de sincronização APR
 * - Fornecer dados completos para mobile
 * - Validar dados de entrada via DTOs
 * - Documentar APIs via Swagger
 * - Tratar erros de forma padronizada
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/apr/sync/modelos - Sincronizar modelos APR
 * - GET /api/apr/sync/perguntas - Sincronizar perguntas APR
 * - GET /api/apr/sync/perguntas/relacoes - Sincronizar relações APR-Perguntas
 * - GET /api/apr/sync/opcoes-resposta - Sincronizar opções de resposta
 * - GET /api/apr/sync/opcoes-resposta/relacoes - Sincronizar relações APR-Opções
 * - GET /api/apr/sync/tipos-atividade/relacoes - Sincronizar relações APR-TipoAtividade
 *
 * PADRÕES IMPLEMENTADOS:
 * - Documentação Swagger completa
 * - Validação automática via class-validator
 * - Tipagem TypeScript rigorosa
 * - Tratamento de erros HTTP padronizado
 * - Logging de operações críticas
 * - Dados completos sem paginação para mobile
 *
 * @example
 * ```bash
 * # Sincronizar modelos APR
 * curl http://localhost:3001/api/apr/sync/modelos
 *
 * # Sincronizar perguntas APR
 * curl http://localhost:3001/api/apr/sync/perguntas
 * ```
 */

import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../engine/auth/guard/jwt-auth.guard';
import { SyncAuditRemoverInterceptor } from '../../shared/interceptors';
import { AprService } from './apr.service';
import {
  AprOpcaoRespostaRelacaoSyncDto,
  AprOpcaoRespostaSyncDto,
  AprPerguntaRelacaoSyncDto,
  AprPerguntaSyncDto,
  AprResponseDto,
  AprTipoAtividadeRelacaoSyncDto,
} from './dto';

/**
 * Controlador de Sincronização APR (Análise Preliminar de Risco)
 *
 * Gerencia exclusivamente os endpoints de sincronização para clientes mobile,
 * fornecendo dados completos sem paginação para manter sincronia offline.
 *
 * SEGURANÇA:
 * - Todas as rotas requerem autenticação JWT
 * - Token deve ser enviado no header Authorization: Bearer <token>
 * - Retorna 401 Unauthorized para requisições não autenticadas
 *
 * PERFORMANCE:
 * - Dados retornados sem paginação para facilitar sincronização
 * - Ordenação otimizada para mobile (updatedAt desc)
 * - Campos de auditoria incluídos para controle de versão
 */
@ApiTags('apr-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(SyncAuditRemoverInterceptor)
@Controller('apr/sync')
export class AprSyncController {
  private readonly logger = new Logger(AprSyncController.name);

  constructor(private readonly aprService: AprService) {}

  /**
   * Retorna todos os modelos APR para sincronização mobile
   *
   * Endpoint específico para clientes mobile obterem a base completa
   * de modelos APR sem paginação.
   *
   * @returns Lista completa de modelos APR ativos
   */
  @Get('modelos')
  @ApiOperation({
    summary: 'Sincronizar modelos APR',
    description:
      'Retorna todos os modelos APR ativos sem paginação para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de modelos APR retornada com sucesso',
    type: [AprResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncModelos(): Promise<AprResponseDto[]> {
    this.logger.log('Iniciando sincronização de modelos APR');
    return this.aprService.findAllForSync();
  }

  /**
   * Retorna todas as perguntas APR para sincronização mobile
   *
   * Endpoint para sincronização de perguntas de Análise Preliminar de Risco.
   *
   * @returns Lista completa de perguntas APR ativas
   */
  @Get('perguntas')
  @ApiOperation({
    summary: 'Sincronizar perguntas APR',
    description:
      'Retorna todas as perguntas APR ativas para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de perguntas APR retornada com sucesso',
    type: [AprPerguntaSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncPerguntas(): Promise<AprPerguntaSyncDto[]> {
    this.logger.log('Iniciando sincronização de perguntas APR');
    return this.aprService.findAllPerguntasForSync();
  }

  /**
   * Retorna todas as relações APR-Perguntas para sincronização mobile
   *
   * Endpoint para sincronização das relações entre modelos APR e suas perguntas.
   *
   * @returns Lista completa de relações APR-Perguntas ativas
   */
  @Get('perguntas/relacoes')
  @ApiOperation({
    summary: 'Sincronizar relações APR-Perguntas',
    description:
      'Retorna todas as relações entre modelos APR e perguntas para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de relações APR-Perguntas retornada com sucesso',
    type: [AprPerguntaRelacaoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncPerguntaRelacoes(): Promise<AprPerguntaRelacaoSyncDto[]> {
    this.logger.log('Iniciando sincronização de relações APR-Perguntas');
    return this.aprService.findAllPerguntaRelacoesForSync();
  }

  /**
   * Retorna todas as opções de resposta APR para sincronização mobile
   *
   * Endpoint para sincronização de opções de resposta de APR.
   *
   * @returns Lista completa de opções de resposta APR ativas
   */
  @Get('opcoes-resposta')
  @ApiOperation({
    summary: 'Sincronizar opções de resposta APR',
    description:
      'Retorna todas as opções de resposta APR ativas para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de opções de resposta APR retornada com sucesso',
    type: [AprOpcaoRespostaSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncOpcoesResposta(): Promise<AprOpcaoRespostaSyncDto[]> {
    this.logger.log('Iniciando sincronização de opções de resposta APR');
    return this.aprService.findAllOpcoesForSync();
  }

  /**
   * Retorna todas as relações APR-Opções de resposta para sincronização mobile
   *
   * Endpoint para sincronização das relações entre modelos APR e opções de resposta.
   *
   * @returns Lista completa de relações APR-Opções ativas
   */
  @Get('opcoes-resposta/relacoes')
  @ApiOperation({
    summary: 'Sincronizar relações APR-Opções de resposta',
    description:
      'Retorna todas as relações entre modelos APR e opções de resposta para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de relações APR-Opções retornada com sucesso',
    type: [AprOpcaoRespostaRelacaoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncOpcaoRespostaRelacoes(): Promise<AprOpcaoRespostaRelacaoSyncDto[]> {
    this.logger.log(
      'Iniciando sincronização de relações APR-Opções de resposta'
    );
    return this.aprService.findAllOpcaoRelacoesForSync();
  }

  /**
   * Retorna todas as relações APR-Tipo de Atividade para sincronização mobile
   *
   * Endpoint para sincronização das relações entre modelos APR e tipos de atividade.
   *
   * @returns Lista completa de relações APR-Tipo de Atividade ativas
   */
  @Get('tipos-atividade/relacoes')
  @ApiOperation({
    summary: 'Sincronizar relações APR-Tipo de Atividade',
    description:
      'Retorna todas as relações entre modelos APR e tipos de atividade para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Lista de relações APR-Tipo de Atividade retornada com sucesso',
    type: [AprTipoAtividadeRelacaoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncTipoAtividadeRelacoes(): Promise<AprTipoAtividadeRelacaoSyncDto[]> {
    this.logger.log(
      'Iniciando sincronização de relações APR-Tipo de Atividade'
    );
    return this.aprService.findAllTipoAtividadeRelacoesForSync();
  }
}

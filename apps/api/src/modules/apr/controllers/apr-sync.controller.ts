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
 * - GET /api/apr/sync/status?checksum=opcional - Status (checksum); changed=false dispensa download
 * - GET /api/apr/sync/modelos?since=opcional - Modelos APR (since=ISO8601 para incremental)
 * - GET /api/apr/sync/perguntas?since=opcional
 * - GET /api/apr/sync/perguntas/relacoes?since=opcional
 * - GET /api/apr/sync/opcoes-resposta?since=opcional
 * - GET /api/apr/sync/opcoes-resposta/relacoes?since=opcional
 * - GET /api/apr/sync/tipos-atividade/relacoes?since=opcional
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

import { validateSince } from '@common/utils/sync-params';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { Controller, Get, HttpStatus, Logger, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { SyncStatusResponseDto } from '@common/dto/sync-status.dto';
import {
  AprOpcaoRespostaRelacaoSyncDto,
  AprOpcaoRespostaSyncDto,
  AprPerguntaRelacaoSyncDto,
  AprPerguntaSyncDto,
  AprResponseDto,
  AprTipoAtividadeRelacaoSyncDto,
} from '../dto';
import { AprSyncService } from '../services/apr-sync.service';

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
 * - GET /status com checksum: evita download quando nada mudou
 * - Parâmetro ?since=ISO8601: sincronização incremental (apenas alterados/deletados)
 * - Respostas incluem updatedAt e deletedAt para o mobile aplicar incremental
 */
@ApiTags('apr-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apr/sync')
export class AprSyncController {
  private readonly logger = new Logger(AprSyncController.name);

  constructor(private readonly aprSyncService: AprSyncService) {}

  /**
   * Retorna status de sincronização (checksum). Permite ao mobile verificar
   * se houve mudanças sem baixar os 6 payloads. Se changed=false, não há
   * necessidade de sincronizar.
   *
   * @param checksum - Checksum obtido na última sincronização (opcional)
   * @returns { changed, checksum, serverTime }
   */
  @Get('status')
  @ApiOperation({
    summary: 'Status de sincronização APR (checksum)',
    description:
      'Retorna checksum e indica se houve mudanças. Se changed=false, o mobile pode pular o download. serverTime pode ser usado como since na próxima incremental.',
  })
  @ApiQuery({
    name: 'checksum',
    required: false,
    description: 'Checksum da última sincronização; se igual ao atual, changed=false',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status retornado com sucesso',
    type: SyncStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  async syncStatus(
    @Query('checksum') checksum?: string,
  ): Promise<SyncStatusResponseDto> {
    this.logger.log('Iniciando verificação de status de sincronização APR');
    return this.aprSyncService.getSyncStatus(checksum);
  }

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
      'Retorna todos os modelos APR ativos. Com ?since=ISO8601: apenas alterados ou deletados após essa data (incremental).',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Data ISO 8601; se presente, retorna só registros atualizados ou deletados após since',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de modelos APR retornada com sucesso',
    type: [AprResponseDto],
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Parâmetro since inválido' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncModelos(
    @Query('since') since?: string,
  ): Promise<AprResponseDto[]> {
    const s = validateSince(since);
    this.logger.log('Iniciando sincronização de modelos APR');
    return this.aprSyncService.findAllForSync(s);
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
      'Retorna todas as perguntas APR ativas. Com ?since=ISO8601: incremental.',
  })
  @ApiQuery({ name: 'since', required: false, description: 'Data ISO 8601 para sincronização incremental' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de perguntas APR retornada com sucesso',
    type: [AprPerguntaSyncDto],
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Parâmetro since inválido' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncPerguntas(
    @Query('since') since?: string,
  ): Promise<AprPerguntaSyncDto[]> {
    const s = validateSince(since);
    this.logger.log('Iniciando sincronização de perguntas APR');
    return this.aprSyncService.findAllPerguntasForSync(s);
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
      'Retorna relações entre modelos APR e perguntas. Com ?since=ISO8601: incremental.',
  })
  @ApiQuery({ name: 'since', required: false, description: 'Data ISO 8601 para sincronização incremental' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de relações APR-Perguntas retornada com sucesso',
    type: [AprPerguntaRelacaoSyncDto],
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Parâmetro since inválido' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncPerguntaRelacoes(
    @Query('since') since?: string,
  ): Promise<AprPerguntaRelacaoSyncDto[]> {
    const s = validateSince(since);
    this.logger.log('Iniciando sincronização de relações APR-Perguntas');
    return this.aprSyncService.findAllPerguntaRelacoesForSync(s);
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
      'Retorna opções de resposta APR ativas. Com ?since=ISO8601: incremental.',
  })
  @ApiQuery({ name: 'since', required: false, description: 'Data ISO 8601 para sincronização incremental' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de opções de resposta APR retornada com sucesso',
    type: [AprOpcaoRespostaSyncDto],
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Parâmetro since inválido' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncOpcoesResposta(
    @Query('since') since?: string,
  ): Promise<AprOpcaoRespostaSyncDto[]> {
    const s = validateSince(since);
    this.logger.log('Iniciando sincronização de opções de resposta APR');
    return this.aprSyncService.findAllOpcoesForSync(s);
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
      'Retorna relações entre modelos APR e opções de resposta. Com ?since=ISO8601: incremental.',
  })
  @ApiQuery({ name: 'since', required: false, description: 'Data ISO 8601 para sincronização incremental' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de relações APR-Opções retornada com sucesso',
    type: [AprOpcaoRespostaRelacaoSyncDto],
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Parâmetro since inválido' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncOpcaoRespostaRelacoes(
    @Query('since') since?: string,
  ): Promise<AprOpcaoRespostaRelacaoSyncDto[]> {
    const s = validateSince(since);
    this.logger.log(
      'Iniciando sincronização de relações APR-Opções de resposta'
    );
    return this.aprSyncService.findAllOpcaoRelacoesForSync(s);
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
      'Retorna relações entre modelos APR e tipos de atividade. Com ?since=ISO8601: incremental.',
  })
  @ApiQuery({ name: 'since', required: false, description: 'Data ISO 8601 para sincronização incremental' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Lista de relações APR-Tipo de Atividade retornada com sucesso',
    type: [AprTipoAtividadeRelacaoSyncDto],
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Parâmetro since inválido' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncTipoAtividadeRelacoes(
    @Query('since') since?: string,
  ): Promise<AprTipoAtividadeRelacaoSyncDto[]> {
    const s = validateSince(since);
    this.logger.log(
      'Iniciando sincronização de relações APR-Tipo de Atividade'
    );
    return this.aprSyncService.findAllTipoAtividadeRelacoesForSync(s);
  }
}

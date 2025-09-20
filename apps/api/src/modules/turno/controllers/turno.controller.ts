/**
 * Controlador de Turnos
 *
 * Este controlador gerencia os endpoints CRUD para turnos,
 * incluindo abertura, fechamento, listagem e consulta.
 *
 * RESPONSABILIDADES:
 * - Gerenciar endpoints de abertura e fechamento de turnos
 * - Gerenciar endpoints CRUD de turnos
 * - Validar dados de entrada via DTOs
 * - Documentar APIs via Swagger
 * - Tratar erros de forma padronizada
 * - Integrar com permissões de contrato
 *
 * ROTAS DISPONÍVEIS:
 * - POST /api/turnos/abrir - Abre um novo turno
 * - POST /api/turnos/fechar - Fecha um turno existente
 * - GET /api/turnos - Lista turnos (paginado)
 * - GET /api/turnos/:id - Busca turno por ID
 * - DELETE /api/turnos/:id - Remove turno
 *
 * PADRÕES IMPLEMENTADOS:
 * - Documentação Swagger completa
 * - Validação automática via class-validator
 * - Tipagem TypeScript rigorosa
 * - Tratamento de erros HTTP padronizado
 * - Logging de operações críticas
 * - Integração com permissões de contrato
 *
 * @example
 * ```bash
 * # Abrir turno
 * curl -X POST http://localhost:3001/api/turnos/abrir \
 *   -H "Content-Type: application/json" \
 *   -d '{"veiculoId": 1, "equipeId": 1, "dispositivo": "SM-G973F-001", "dataInicio": "2024-01-01T08:00:00.000Z", "kmInicio": 50000, "eletricistas": [{"eletricistaId": 1}]}'
 *
 * # Fechar turno
 * curl -X POST http://localhost:3001/api/turnos/fechar \
 *   -H "Content-Type: application/json" \
 *   -d '{"turnoId": 1, "dataFim": "2024-01-01T17:00:00.000Z", "kmFim": 50120}'
 * ```
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpStatus,
  Logger,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
import { GetUserContracts } from '@modules/engine/auth/decorators/get-user-contracts.decorator';
import { TurnoService } from '../services/turno.service';
import {
  AbrirTurnoDto,
  FecharTurnoDto,
  TurnoResponseDto,
  TurnoListResponseDto,
  TurnoQueryDto,
} from '../dto';

/**
 * Controlador responsável pelas operações de turnos
 *
 * SEGURANÇA:
 * - Todas as rotas requerem autenticação JWT
 * - Token deve ser enviado no header Authorization: Bearer <token>
 * - Retorna 401 Unauthorized para requisições não autenticadas
 * - Integração com permissões de contrato para controle de acesso
 *
 * PERFORMANCE:
 * - Listagem paginada para otimizar performance
 * - Ordenação otimizada (data de solicitação em desc)
 * - Filtros de busca para facilitar localização
 * - Validação de parâmetros para prevenir consultas inválidas
 */
@ApiTags('turnos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('turnos')
export class TurnoController {
  private readonly logger = new Logger(TurnoController.name);

  constructor(private readonly turnoService: TurnoService) {}

  /**
   * Abre um novo turno
   *
   * @param abrirDto - Dados para abertura do turno
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Turno criado com ID remoto
   */
  @Post('abrir')
  @ApiOperation({
    summary: 'Abre um novo turno',
    description:
      'Abre um novo turno com validações de conflito (veículo, equipe, eletricista)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Turno aberto com sucesso',
    type: TurnoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Já existe um turno aberto para este veículo/equipe/eletricista',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Veículo, equipe ou eletricista não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para abrir turnos',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async abrirTurno(
    @Body() abrirDto: AbrirTurnoDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<TurnoResponseDto> {
    this.logger.log(
      `Abrindo turno - Veículo: ${abrirDto.veiculoId}, Equipe: ${abrirDto.equipeId}`
    );
    return this.turnoService.abrirTurno(abrirDto, allowedContracts);
  }

  /**
   * Fecha um turno existente
   *
   * @param fecharDto - Dados para fechamento do turno
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Turno fechado
   */
  @Post('fechar')
  @ApiOperation({
    summary: 'Fecha um turno existente',
    description: 'Fecha um turno existente com validações de negócio',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Turno fechado com sucesso',
    type: TurnoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Turno não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Turno já está fechado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para fechar turnos',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async fecharTurno(
    @Body() fecharDto: FecharTurnoDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<TurnoResponseDto> {
    this.logger.log(`Fechando turno - ID: ${fecharDto.turnoId}`);
    return this.turnoService.fecharTurno(fecharDto, allowedContracts);
  }

  /**
   * Lista turnos com paginação e filtros
   *
   * @param query - Parâmetros de consulta (página, limite, filtros)
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Lista paginada de turnos
   */
  @Get()
  @ApiOperation({
    summary: 'Lista turnos',
    description: 'Retorna uma lista paginada de turnos com opção de filtros',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de turnos retornada com sucesso',
    type: TurnoListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de consulta inválidos',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página da consulta',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de registros por página',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Termo de busca para filtrar turnos',
    example: 'ABC1234',
  })
  @ApiQuery({
    name: 'veiculoId',
    required: false,
    description: 'ID do veículo para filtrar',
    example: 1,
  })
  @ApiQuery({
    name: 'equipeId',
    required: false,
    description: 'ID da equipe para filtrar',
    example: 1,
  })
  @ApiQuery({
    name: 'eletricistaId',
    required: false,
    description: 'ID do eletricista para filtrar',
    example: 1,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Status do turno para filtrar',
    example: 'ABERTO',
    enum: ['ABERTO', 'FECHADO', 'CANCELADO'],
  })
  @ApiQuery({
    name: 'dataInicio',
    required: false,
    description: 'Data de início para filtrar (formato ISO)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'dataFim',
    required: false,
    description: 'Data de fim para filtrar (formato ISO)',
    example: '2024-01-31T23:59:59.999Z',
  })
  async findAll(
    @Query() query: TurnoQueryDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<TurnoListResponseDto> {
    this.logger.log('Listando turnos');
    return this.turnoService.findAll(
      {
        page: query.page || 1,
        limit: query.limit || 10,
        search: query.search,
        veiculoId: query.veiculoId,
        equipeId: query.equipeId,
        eletricistaId: query.eletricistaId,
        status: query.status,
        dataInicio: query.dataInicio,
        dataFim: query.dataFim,
      },
      allowedContracts
    );
  }

  /**
   * Busca um turno por ID
   *
   * @param id - ID do turno
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Turno encontrado
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Busca turno por ID',
    description: 'Retorna um turno específico pelo seu ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Turno encontrado com sucesso',
    type: TurnoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Turno não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do turno',
    example: 1,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<TurnoResponseDto> {
    this.logger.log(`Buscando turno com ID: ${id}`);
    return this.turnoService.findOne(id, allowedContracts);
  }

  /**
   * Remove um turno (soft delete)
   *
   * @param id - ID do turno
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Turno removido
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Remove turno',
    description: 'Remove um turno do sistema (soft delete)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Turno removido com sucesso',
    type: TurnoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Turno não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para remover turnos',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do turno',
    example: 1,
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<TurnoResponseDto> {
    this.logger.log(`Removendo turno com ID: ${id}`);
    return this.turnoService.remove(id, allowedContracts);
  }
}

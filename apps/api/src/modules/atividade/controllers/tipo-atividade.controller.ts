/**
 * Controlador de Tipos de Atividade
 *
 * Este controlador gerencia os endpoints CRUD para tipos de atividade,
 * incluindo listagem paginada, criação, consulta, atualização e exclusão.
 *
 * RESPONSABILIDADES:
 * - Gerenciar endpoints CRUD de tipos de atividade
 * - Validar dados de entrada via DTOs
 * - Documentar APIs via Swagger
 * - Tratar erros de forma padronizada
 * - Integrar com permissões de contrato
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/atividade/tipos - Lista tipos de atividade (paginado)
 * - POST /api/atividade/tipos - Cria novo tipo de atividade
 * - GET /api/atividade/tipos/:id - Busca tipo de atividade por ID
 * - PATCH /api/atividade/tipos/:id - Atualiza tipo de atividade
 * - DELETE /api/atividade/tipos/:id - Remove tipo de atividade
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
 * # Listar tipos de atividade
 * curl http://localhost:3001/api/atividade/tipos?page=1&limit=10
 *
 * # Criar tipo de atividade
 * curl -X POST http://localhost:3001/api/atividade/tipos \
 *   -H "Content-Type: application/json" \
 *   -d '{"nome": "Soldagem"}'
 * ```
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { TipoAtividadeService } from '../services/tipo-atividade.service';
import {
  CreateTipoAtividadeDto,
  UpdateTipoAtividadeDto,
  TipoAtividadeResponseDto,
  TipoAtividadeListResponseDto,
  TipoAtividadeQueryDto,
} from '../dto';

/**
 * Controlador responsável pelas operações CRUD de tipos de atividade
 *
 * SEGURANÇA:
 * - Todas as rotas requerem autenticação JWT
 * - Token deve ser enviado no header Authorization: Bearer <token>
 * - Retorna 401 Unauthorized para requisições não autenticadas
 * - Integração com permissões de contrato para controle de acesso
 *
 * PERFORMANCE:
 * - Listagem paginada para otimizar performance
 * - Ordenação otimizada (criado em desc)
 * - Filtros de busca para facilitar localização
 * - Validação de parâmetros para prevenir consultas inválidas
 */
@ApiTags('atividade-tipos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('atividade/tipos')
export class TipoAtividadeController {
  private readonly logger = new Logger(TipoAtividadeController.name);

  constructor(private readonly tipoAtividadeService: TipoAtividadeService) {}

  /**
   * Lista tipos de atividade com paginação e busca
   *
   * @param query - Parâmetros de consulta (página, limite, busca)
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Lista paginada de tipos de atividade
   */
  @Get()
  @ApiOperation({
    summary: 'Lista tipos de atividade',
    description: 'Retorna uma lista paginada de tipos de atividade com opção de busca',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de atividade retornada com sucesso',
    type: TipoAtividadeListResponseDto,
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
    description: 'Termo de busca para filtrar tipos de atividade',
    example: 'Soldagem',
  })
  async findAll(
    @Query() query: TipoAtividadeQueryDto,
    @GetUserContracts() allowedContracts: ContractPermission[],
  ): Promise<TipoAtividadeListResponseDto> {
    this.logger.log('Listando tipos de atividade');
    return this.tipoAtividadeService.findAll({
      page: query.page || 1,
      limit: query.limit || 10,
      search: query.search,
    }, allowedContracts);
  }

  /**
   * Cria um novo tipo de atividade
   *
   * @param createDto - Dados para criação do tipo de atividade
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Tipo de atividade criado
   */
  @Post()
  @ApiOperation({
    summary: 'Cria tipo de atividade',
    description: 'Cria um novo tipo de atividade no sistema',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tipo de atividade criado com sucesso',
    type: TipoAtividadeResponseDto,
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
    description: 'Já existe um tipo de atividade com este nome',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para criar tipos de atividade',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async create(
    @Body() createDto: CreateTipoAtividadeDto,
    @GetUserContracts() allowedContracts: ContractPermission[],
  ): Promise<TipoAtividadeResponseDto> {
    this.logger.log(`Criando tipo de atividade: ${createDto.nome}`);
    return this.tipoAtividadeService.create(createDto, allowedContracts);
  }

  /**
   * Busca um tipo de atividade por ID
   *
   * @param id - ID do tipo de atividade
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Tipo de atividade encontrado
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Busca tipo de atividade por ID',
    description: 'Retorna um tipo de atividade específico pelo seu ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de atividade encontrado com sucesso',
    type: TipoAtividadeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de atividade não encontrado',
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
    description: 'ID do tipo de atividade',
    example: 1,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUserContracts() allowedContracts: ContractPermission[],
  ): Promise<TipoAtividadeResponseDto> {
    this.logger.log(`Buscando tipo de atividade com ID: ${id}`);
    return this.tipoAtividadeService.findOne(id, allowedContracts);
  }

  /**
   * Atualiza um tipo de atividade existente
   *
   * @param id - ID do tipo de atividade
   * @param updateDto - Dados para atualização
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Tipo de atividade atualizado
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza tipo de atividade',
    description: 'Atualiza um tipo de atividade existente no sistema',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de atividade atualizado com sucesso',
    type: TipoAtividadeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de atividade não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um tipo de atividade com este nome',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para atualizar tipos de atividade',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do tipo de atividade',
    example: 1,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTipoAtividadeDto,
    @GetUserContracts() allowedContracts: ContractPermission[],
  ): Promise<TipoAtividadeResponseDto> {
    this.logger.log(`Atualizando tipo de atividade com ID: ${id}`);
    return this.tipoAtividadeService.update(id, updateDto, allowedContracts);
  }

  /**
   * Remove um tipo de atividade (soft delete)
   *
   * @param id - ID do tipo de atividade
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Tipo de atividade removido
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Remove tipo de atividade',
    description: 'Remove um tipo de atividade do sistema (soft delete)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de atividade removido com sucesso',
    type: TipoAtividadeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de atividade não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para remover tipos de atividade',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do tipo de atividade',
    example: 1,
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUserContracts() allowedContracts: ContractPermission[],
  ): Promise<TipoAtividadeResponseDto> {
    this.logger.log(`Removendo tipo de atividade com ID: ${id}`);
    return this.tipoAtividadeService.remove(id, allowedContracts);
  }
}

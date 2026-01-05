/**
 * Controlador de APR (Análise Preliminar de Risco) - CRUD
 *
 * Este controlador gerencia exclusivamente as operações CRUD relacionadas
 * aos modelos de APR, incluindo listagem paginada, criação, atualização e exclusão.
 *
 * RESPONSABILIDADES:
 * - Gerenciar endpoints CRUD de APR modelos
 * - Validar dados de entrada via DTOs
 * - Documentar APIs via Swagger
 * - Tratar erros de forma padronizada
 * - Implementar logging estruturado
 * - Gerenciar paginação e busca
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/apr/modelos - Lista todos os modelos de APR (paginado)
 * - POST /api/apr/modelos - Cria novo modelo de APR
 * - GET /api/apr/modelos/:id - Busca modelo específico
 * - PUT /api/apr/modelos/:id - Atualiza modelo existente
 * - DELETE /api/apr/modelos/:id - Remove modelo (soft delete)
 * - GET /api/apr/modelos/count - Conta total de modelos ativos
 *
 * PADRÕES IMPLEMENTADOS:
 * - Documentação Swagger completa
 * - Validação automática via class-validator
 * - Tipagem TypeScript rigorosa
 * - Tratamento de erros HTTP padronizado
 * - Logging de operações críticas
 * - Paginação eficiente com metadados
 *
 * @example
 * ```bash
 * # Listar modelos APR com paginação
 * curl "http://localhost:3001/api/apr/modelos?page=1&limit=10&search=soldagem"
 *
 * # Criar novo modelo
 * curl -X POST http://localhost:3001/api/apr/modelos \
 *   -H "Content-Type: application/json" \
 *   -d '{"nome": "APR Soldagem"}'
 *
 * # Buscar modelo específico
 * curl http://localhost:3001/api/apr/modelos/1
 * ```
 */

import { GetUsuarioMobileId } from '@modules/engine/auth/decorators/get-user-id-decorator';
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

import {
  AprListResponseDto,
  AprResponseDto,
  CreateAprDto,
  UpdateAprDto,
  AprQueryDto,
} from '../dto';
import { AprService } from '../services/apr.service';

/**
 * Controlador de APR (Análise Preliminar de Risco) - CRUD
 *
 * Gerencia exclusivamente as operações CRUD para modelos de APR,
 * com foco em listagem paginada, criação, atualização e exclusão.
 *
 * SEGURANÇA:
 * - Todas as rotas requerem autenticação JWT
 * - Token deve ser enviado no header Authorization: Bearer <token>
 * - Retorna 401 Unauthorized para requisições não autenticadas
 *
 * PERFORMANCE:
 * - Listagem paginada para otimizar performance
 * - Busca por nome com índice otimizado
 * - Soft delete para preservar histórico
 * - Validações rigorosas para integridade dos dados
 */
@ApiTags('apr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apr')
export class AprController {
  private readonly logger = new Logger(AprController.name);

  constructor(private readonly aprService: AprService) {}

  /**
   * Lista todos os modelos APR com paginação e busca
   *
   * Retorna uma lista paginada de modelos APR com possibilidade
   * de busca por nome e ordenação por data de criação.
   *
   * @param query - Parâmetros de consulta (página, limite, busca)
   * @returns Lista paginada de modelos APR
   */
  @Get('modelos')
  @ApiOperation({
    summary: 'Listar modelos APR',
    description:
      'Retorna lista paginada de modelos APR com possibilidade de busca por nome',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Itens por página',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Termo de busca por nome',
    example: 'soldagem',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de modelos APR retornada com sucesso',
    type: AprListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de consulta inválidos',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async findAll(@Query() query: AprQueryDto): Promise<AprListResponseDto> {
    const { page = 1, limit = 10, search } = query;

    this.logger.log(
      `Listando modelos APR - Página: ${page}, Limite: ${limit}, Busca: ${search || 'N/A'}`
    );

    return this.aprService.findAll({
      page,
      limit,
      search,
    });
  }

  /**
   * Busca modelo APR por ID
   *
   * Retorna um modelo específico de APR baseado no ID fornecido.
   *
   * @param id - ID único do modelo APR
   * @returns Modelo APR encontrado
   */
  @Get('modelos/:id')
  @ApiOperation({
    summary: 'Buscar modelo APR por ID',
    description: 'Retorna um modelo específico de APR baseado no ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do modelo APR',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Modelo APR encontrado com sucesso',
    type: AprResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Modelo APR não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<AprResponseDto> {
    this.logger.log(`Buscando modelo APR por ID: ${id}`);
    return this.aprService.findOne(id);
  }

  /**
   * Cria novo modelo APR
   *
   * Cria um novo modelo de APR no sistema com validação
   * de duplicatas por nome.
   *
   * @param createAprDto - Dados do novo modelo APR
   * @returns Modelo APR criado
   */
  @Post('modelos')
  @ApiOperation({
    summary: 'Criar modelo APR',
    description: 'Cria um novo modelo de APR no sistema',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Modelo APR criado com sucesso',
    type: AprResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um modelo APR com o mesmo nome',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async create(
    @Body() createAprDto: CreateAprDto,
    @GetUsuarioMobileId() userId?: string
  ): Promise<AprResponseDto> {
    this.logger.log(`Criando novo modelo APR: ${createAprDto.nome}`);
    return this.aprService.create(createAprDto, userId);
  }

  /**
   * Atualiza modelo APR existente
   *
   * Atualiza um modelo de APR existente com os novos dados,
   * incluindo validação de duplicatas.
   *
   * @param id - ID do modelo APR a ser atualizado
   * @param updateAprDto - Novos dados do modelo APR
   * @returns Modelo APR atualizado
   */
  @Put('modelos/:id')
  @ApiOperation({
    summary: 'Atualizar modelo APR',
    description: 'Atualiza um modelo de APR existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do modelo APR',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Modelo APR atualizado com sucesso',
    type: AprResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Modelo APR não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um modelo APR com o mesmo nome',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAprDto: UpdateAprDto,
    @GetUsuarioMobileId() userId?: string
  ): Promise<AprResponseDto> {
    this.logger.log(`Atualizando modelo APR ${id}`);
    return this.aprService.update(id, updateAprDto, userId);
  }

  /**
   * Remove modelo APR (soft delete)
   *
   * Remove logicamente um modelo de APR do sistema,
   * preservando os dados para auditoria.
   *
   * @param id - ID do modelo APR a ser removido
   * @returns void
   */
  @Delete('modelos/:id')
  @ApiOperation({
    summary: 'Remover modelo APR',
    description: 'Remove logicamente um modelo de APR (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do modelo APR',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Modelo APR removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Modelo APR não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUsuarioMobileId() userId?: string
  ): Promise<void> {
    this.logger.log(`Removendo modelo APR: ${id}`);
    return this.aprService.remove(id, userId);
  }

  /**
   * Conta total de modelos APR ativos
   *
   * Retorna o número total de modelos APR ativos no sistema.
   *
   * @returns Número total de modelos ativos
   */
  @Get('modelos/count')
  @ApiOperation({
    summary: 'Contar modelos APR',
    description: 'Retorna o número total de modelos APR ativos',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contagem retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Número total de modelos APR ativos',
          example: 25,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async count(): Promise<{ count: number }> {
    this.logger.log('Contando modelos APR ativos');
    const count = await this.aprService.count();
    return { count };
  }
}

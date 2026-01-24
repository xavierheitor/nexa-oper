/**
 * Controlador de Tipos de Equipe - CRUD
 *
 * Responsável por gerenciar as operações de tipos de equipe com foco em
 * listagem, criação, atualização e remoção.
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/tipo-equipe - Lista tipos de equipe com paginação e filtros
 * - POST /api/tipo-equipe - Cria novo tipo de equipe
 * - GET /api/tipo-equipe/:id - Busca tipo de equipe específico
 * - PUT /api/tipo-equipe/:id - Atualiza tipo de equipe existente
 * - DELETE /api/tipo-equipe/:id - Remove tipo de equipe (soft delete)
 * - GET /api/tipo-equipe/count - Conta tipos de equipe ativos
 */

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
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
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  CreateTipoEquipeDto,
  UpdateTipoEquipeDto,
  TipoEquipeListResponseDto,
  TipoEquipeQueryDto,
  TipoEquipeResponseDto,
} from '../dto';
import { TipoEquipeService } from '../services/tipo-equipe.service';

@ApiTags('tipo-equipe')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tipo-equipe')
export class TipoEquipeController {
  private readonly logger = new Logger(TipoEquipeController.name);

  constructor(private readonly tipoEquipeService: TipoEquipeService) {}

  /**
   * Lista tipos de equipe com paginação e filtros
   */
  @Get()
  @ApiOperation({
    summary: 'Listar tipos de equipe',
    description:
      'Retorna lista paginada de tipos de equipe com filtros opcionais',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página (começando em 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Quantidade de itens por página',
    example: 10,
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description: 'Campo para ordenação',
    example: 'nome',
  })
  @ApiQuery({
    name: 'orderDir',
    required: false,
    description: 'Direção da ordenação (asc ou desc)',
    example: 'asc',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Termo de busca textual',
    example: 'Linha Viva',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de equipe retornada com sucesso',
    type: TipoEquipeListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de consulta inválidos',
  })
  async findAll(
    @Query() query: TipoEquipeQueryDto
  ): Promise<TipoEquipeListResponseDto> {
    this.logger.log('Listando tipos de equipe', { query });
    return this.tipoEquipeService.findAll(query);
  }

  /**
   * Conta tipos de equipe ativos
   */
  @Get('count')
  @ApiOperation({
    summary: 'Contar tipos de equipe',
    description: 'Retorna quantidade total de tipos de equipe ativos',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Termo de busca textual',
    example: 'Linha Viva',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contagem retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Número total de tipos de equipe ativos',
          example: 25,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  async count(@Query('search') search?: string): Promise<{ count: number }> {
    this.logger.log('Contando tipos de equipe', { search });
    const count = await this.tipoEquipeService.count(search);
    return { count };
  }

  /**
   * Cria novo tipo de equipe
   */
  @Post()
  @ApiOperation({
    summary: 'Criar tipo de equipe',
    description: 'Cria um novo tipo de equipe no sistema',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tipo de equipe criado com sucesso',
    type: TipoEquipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos fornecidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um tipo de equipe com este nome',
  })
  async create(
    @Body() createDto: CreateTipoEquipeDto
  ): Promise<TipoEquipeResponseDto> {
    this.logger.log('Criando tipo de equipe', { nome: createDto.nome });
    return this.tipoEquipeService.create(createDto);
  }

  /**
   * Busca tipo de equipe por ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar tipo de equipe por ID',
    description: 'Retorna um tipo de equipe específico pelo seu ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do tipo de equipe',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de equipe encontrado com sucesso',
    type: TipoEquipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de equipe não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido fornecido',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<TipoEquipeResponseDto> {
    this.logger.log(`Buscando tipo de equipe por ID: ${id}`);
    return this.tipoEquipeService.findById(id);
  }

  /**
   * Atualiza tipo de equipe existente
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar tipo de equipe',
    description: 'Atualiza um tipo de equipe existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do tipo de equipe',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de equipe atualizado com sucesso',
    type: TipoEquipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de equipe não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos fornecidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um tipo de equipe com este nome',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTipoEquipeDto
  ): Promise<TipoEquipeResponseDto> {
    this.logger.log(`Atualizando tipo de equipe: ${id}`, updateDto);
    return this.tipoEquipeService.update(id, updateDto);
  }

  /**
   * Remove tipo de equipe (soft delete)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Remover tipo de equipe',
    description: 'Remove um tipo de equipe do sistema (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do tipo de equipe',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tipo de equipe removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de equipe não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido fornecido ou tipo está sendo usado',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Removendo tipo de equipe: ${id}`);
    await this.tipoEquipeService.remove(id);
  }
}

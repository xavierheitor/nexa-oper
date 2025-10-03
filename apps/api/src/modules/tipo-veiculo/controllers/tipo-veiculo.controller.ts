/**
 * Controlador de Tipos de Veículo - CRUD
 *
 * Responsável por gerenciar as operações de tipos de veículo com foco em
 * listagem, criação, atualização e remoção.
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/tipo-veiculo - Lista tipos de veículo com paginação e filtros
 * - POST /api/tipo-veiculo - Cria novo tipo de veículo
 * - GET /api/tipo-veiculo/:id - Busca tipo de veículo específico
 * - PUT /api/tipo-veiculo/:id - Atualiza tipo de veículo existente
 * - DELETE /api/tipo-veiculo/:id - Remove tipo de veículo (soft delete)
 * - GET /api/tipo-veiculo/count - Conta tipos de veículo ativos
 */

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
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import { TipoVeiculoService } from '../services/tipo-veiculo.service';
import {
  CreateTipoVeiculoDto,
  UpdateTipoVeiculoDto,
  TipoVeiculoListResponseDto,
  TipoVeiculoQueryDto,
  TipoVeiculoResponseDto,
} from '../dto';

@ApiTags('tipo-veiculo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tipo-veiculo')
export class TipoVeiculoController {
  private readonly logger = new Logger(TipoVeiculoController.name);

  constructor(private readonly tipoVeiculoService: TipoVeiculoService) {}

  /**
   * Lista tipos de veículo com paginação e filtros
   */
  @Get()
  @ApiOperation({
    summary: 'Listar tipos de veículo',
    description: 'Retorna lista paginada de tipos de veículo com filtros opcionais',
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
    example: 'Caminhão',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de veículo retornada com sucesso',
    type: TipoVeiculoListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de consulta inválidos',
  })
  async findAll(@Query() query: TipoVeiculoQueryDto): Promise<TipoVeiculoListResponseDto> {
    this.logger.log('Listando tipos de veículo', { query });
    return this.tipoVeiculoService.findAll(query);
  }

  /**
   * Conta tipos de veículo ativos
   */
  @Get('count')
  @ApiOperation({
    summary: 'Contar tipos de veículo',
    description: 'Retorna quantidade total de tipos de veículo ativos',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Termo de busca textual',
    example: 'Caminhão',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contagem retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Número total de tipos de veículo ativos',
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
    this.logger.log('Contando tipos de veículo', { search });
    const count = await this.tipoVeiculoService.count(search);
    return { count };
  }

  /**
   * Cria novo tipo de veículo
   */
  @Post()
  @ApiOperation({
    summary: 'Criar tipo de veículo',
    description: 'Cria um novo tipo de veículo no sistema',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tipo de veículo criado com sucesso',
    type: TipoVeiculoResponseDto,
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
    description: 'Já existe um tipo de veículo com este nome',
  })
  async create(@Body() createDto: CreateTipoVeiculoDto): Promise<TipoVeiculoResponseDto> {
    this.logger.log('Criando tipo de veículo', { nome: createDto.nome });
    return this.tipoVeiculoService.create(createDto);
  }

  /**
   * Busca tipo de veículo por ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar tipo de veículo por ID',
    description: 'Retorna um tipo de veículo específico pelo seu ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do tipo de veículo',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de veículo encontrado com sucesso',
    type: TipoVeiculoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de veículo não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido fornecido',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TipoVeiculoResponseDto> {
    this.logger.log(`Buscando tipo de veículo por ID: ${id}`);
    return this.tipoVeiculoService.findById(id);
  }

  /**
   * Atualiza tipo de veículo existente
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar tipo de veículo',
    description: 'Atualiza um tipo de veículo existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do tipo de veículo',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de veículo atualizado com sucesso',
    type: TipoVeiculoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de veículo não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos fornecidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um tipo de veículo com este nome',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTipoVeiculoDto,
  ): Promise<TipoVeiculoResponseDto> {
    this.logger.log(`Atualizando tipo de veículo: ${id}`, updateDto);
    return this.tipoVeiculoService.update(id, updateDto);
  }

  /**
   * Remove tipo de veículo (soft delete)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Remover tipo de veículo',
    description: 'Remove um tipo de veículo do sistema (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do tipo de veículo',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tipo de veículo removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de veículo não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido fornecido ou tipo está sendo usado',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Removendo tipo de veículo: ${id}`);
    await this.tipoVeiculoService.remove(id);
  }
}

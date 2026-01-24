/**
 * Controlador de Tipos de Veículo - CRUD
 *
 * ROTAS: GET/POST /tipo-veiculo, GET/PUT/DELETE /tipo-veiculo/:id, GET /tipo-veiculo/count
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
  CreateTipoVeiculoDto,
  UpdateTipoVeiculoDto,
  TipoVeiculoListResponseDto,
  TipoVeiculoQueryDto,
  TipoVeiculoResponseDto,
} from '../dto';
import { TipoVeiculoService } from '../services/tipo-veiculo.service';

@ApiTags('tipo-veiculo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tipo-veiculo')
export class TipoVeiculoController {
  private readonly logger = new Logger(TipoVeiculoController.name);

  constructor(private readonly tipoVeiculoService: TipoVeiculoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tipos de veículo' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'orderBy', required: false })
  @ApiQuery({ name: 'orderDir', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: HttpStatus.OK, type: TipoVeiculoListResponseDto })
  async findAll(
    @Query() query: TipoVeiculoQueryDto
  ): Promise<TipoVeiculoListResponseDto> {
    this.logger.log('Listando tipos de veículo', { query });
    return this.tipoVeiculoService.findAll(query);
  }

  @Get('count')
  @ApiOperation({ summary: 'Contar tipos de veículo' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: HttpStatus.OK })
  async count(@Query('search') search?: string): Promise<{ count: number }> {
    const count = await this.tipoVeiculoService.count(search);
    return { count };
  }

  @Post()
  @ApiOperation({ summary: 'Criar tipo de veículo' })
  @ApiResponse({ status: HttpStatus.CREATED, type: TipoVeiculoResponseDto })
  async create(
    @Body() createDto: CreateTipoVeiculoDto
  ): Promise<TipoVeiculoResponseDto> {
    this.logger.log('Criando tipo de veículo', { nome: createDto.nome });
    return this.tipoVeiculoService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tipo de veículo por ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: HttpStatus.OK, type: TipoVeiculoResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<TipoVeiculoResponseDto> {
    return this.tipoVeiculoService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar tipo de veículo' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: HttpStatus.OK, type: TipoVeiculoResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTipoVeiculoDto
  ): Promise<TipoVeiculoResponseDto> {
    this.logger.log(`Atualizando tipo de veículo: ${id}`, updateDto);
    return this.tipoVeiculoService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover tipo de veículo (soft delete)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Removendo tipo de veículo: ${id}`);
    await this.tipoVeiculoService.remove(id);
  }
}

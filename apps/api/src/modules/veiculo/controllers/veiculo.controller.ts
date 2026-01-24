/**
 * Controlador de Veículos - CRUD
 *
 * Responsável por gerenciar as operações de veículos com foco em
 * listagem filtrada por contratos, criação, atualização e remoção.
 * Todas as rotas respeitam as permissões de contrato do usuário,
 * garantindo que somente veículos de contratos autorizados sejam
 * retornados ou manipulados.
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/veiculos - Lista veículos com paginação e filtros
 * - POST /api/veiculos - Cria novo veículo
 * - GET /api/veiculos/:id - Busca veículo específico
 * - PUT /api/veiculos/:id - Atualiza veículo existente
 * - DELETE /api/veiculos/:id - Remove veículo (soft delete)
 * - GET /api/veiculos/count - Conta veículos ativos com base nas permissões
 */

import {
  RequireContractPermission,
  OptionalContractPermission,
} from '@core/auth/decorators/contract-permission.decorator';
import { GetUserContracts } from '@core/auth/decorators/get-user-contracts.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { ContractPermission } from '@core/auth/services/contract-permissions.service';
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
  CreateVeiculoDto,
  UpdateVeiculoDto,
  VeiculoListResponseDto,
  VeiculoQueryDto,
  VeiculoResponseDto,
} from '../dto';
import { VeiculoService } from '../services/veiculo.service';

@ApiTags('veiculos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('veiculos')
export class VeiculoController {
  private readonly logger = new Logger(VeiculoController.name);

  constructor(private readonly veiculoService: VeiculoService) {}

  /**
   * Lista veículos com paginação e filtros, respeitando permissões
   */
  @Get()
  @ApiOperation({
    summary: 'Listar veículos',
    description:
      'Retorna lista paginada de veículos filtrando automaticamente pelos contratos permitidos ao usuário',
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
    description: 'Termo de busca (placa ou modelo)',
    example: 'ABC',
  })
  @ApiQuery({
    name: 'tipoVeiculoId',
    required: false,
    description: 'Filtrar por tipo de veículo',
    example: 5,
  })
  @ApiQuery({
    name: 'contratoId',
    required: false,
    description: 'Filtrar por contrato específico',
    example: 12,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de veículos retornada com sucesso',
    type: VeiculoListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para o contrato solicitado',
  })
  async findAll(
    @Query() query: VeiculoQueryDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<VeiculoListResponseDto> {
    const { page = 1, limit = 10, search, tipoVeiculoId, contratoId } = query;

    this.logger.log(
      `Listando veículos - Página: ${page}, Limite: ${limit}, Busca: ${
        search || 'N/A'
      }`
    );

    return this.veiculoService.findAll(
      {
        page,
        limit,
        search,
        tipoVeiculoId,
        contratoId,
      },
      allowedContracts
    );
  }

  /**
   * Conta veículos ativos considerando permissões
   */
  @Get('count')
  @ApiOperation({
    summary: 'Contar veículos',
    description:
      'Retorna a quantidade de veículos ativos acessíveis para o usuário autenticado',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contagem retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Quantidade de veículos acessíveis',
          example: 42,
        },
      },
    },
  })
  async count(
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<{ count: number }> {
    const count = await this.veiculoService.count(allowedContracts);
    return { count };
  }

  /**
   * Busca veículo específico por ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar veículo por ID',
    description:
      'Retorna dados de um veículo específico respeitando as permissões de contrato do usuário',
  })
  @ApiParam({ name: 'id', description: 'ID único do veículo', example: 101 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Veículo encontrado com sucesso',
    type: VeiculoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Veículo não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para acessar o contrato do veículo',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<VeiculoResponseDto> {
    this.logger.log(`Buscando veículo ${id}`);
    return this.veiculoService.findOne(id, allowedContracts);
  }

  /**
   * Cria novo veículo
   */
  @Post()
  @RequireContractPermission('contratoId', { bodyPath: 'contratoId' })
  @ApiOperation({
    summary: 'Criar veículo',
    description:
      'Cria um novo veículo vinculado a um contrato permitido para o usuário',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Veículo criado com sucesso',
    type: VeiculoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Placa já cadastrada',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de veículo ou contrato não encontrado',
  })
  async create(
    @Body() createVeiculoDto: CreateVeiculoDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<VeiculoResponseDto> {
    this.logger.log(`Criando veículo ${createVeiculoDto.placa}`);
    return this.veiculoService.create(createVeiculoDto, allowedContracts);
  }

  /**
   * Atualiza veículo existente
   */
  @Put(':id')
  @OptionalContractPermission('contratoId', { bodyPath: 'contratoId' })
  @ApiOperation({
    summary: 'Atualizar veículo',
    description:
      'Atualiza um veículo existente respeitando as permissões de contrato do usuário',
  })
  @ApiParam({ name: 'id', description: 'ID único do veículo', example: 101 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Veículo atualizado com sucesso',
    type: VeiculoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Veículo não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Placa já cadastrada',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVeiculoDto: UpdateVeiculoDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<VeiculoResponseDto> {
    this.logger.log(`Atualizando veículo ${id}`);
    return this.veiculoService.update(id, updateVeiculoDto, allowedContracts);
  }

  /**
   * Remove veículo (soft delete)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Remover veículo',
    description:
      'Realiza soft delete de um veículo respeitando as permissões do usuário',
  })
  @ApiParam({ name: 'id', description: 'ID único do veículo', example: 101 })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Veículo removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Veículo não encontrado',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<void> {
    this.logger.log(`Removendo veículo ${id}`);
    await this.veiculoService.remove(id, allowedContracts);
  }
}

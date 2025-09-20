/**
 * Controlador de Equipes - CRUD
 *
 * Responsável por gerenciar as operações de equipes com foco em
 * listagem filtrada por contratos, criação, atualização e remoção.
 * Todas as rotas respeitam as permissões de contrato do usuário,
 * garantindo que somente equipes de contratos autorizados sejam
 * retornadas ou manipuladas.
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/equipes - Lista equipes com paginação e filtros
 * - POST /api/equipes - Cria nova equipe
 * - GET /api/equipes/:id - Busca equipe específica
 * - PUT /api/equipes/:id - Atualiza equipe existente
 * - DELETE /api/equipes/:id - Remove equipe (soft delete)
 * - GET /api/equipes/count - Conta equipes ativas com base nas permissões
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
import {
  RequireContractPermission,
  OptionalContractPermission,
} from '@modules/engine/auth/decorators/contract-permission.decorator';
import { GetUserContracts } from '@modules/engine/auth/decorators/get-user-contracts.decorator';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
import { EquipeService } from '../services/equipe.service';
import {
  CreateEquipeDto,
  UpdateEquipeDto,
  EquipeResponseDto,
  EquipeListResponseDto,
} from '../dto';

/**
 * Controlador de Equipes
 */
@ApiTags('Equipes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equipes')
export class EquipeController {
  private readonly logger = new Logger(EquipeController.name);

  constructor(private readonly equipeService: EquipeService) {}

  /**
   * Lista equipes com paginação e filtros
   */
  @Get()
  @ApiOperation({
    summary: 'Lista equipes com paginação e filtros',
    description: 'Retorna uma lista paginada de equipes respeitando as permissões de contrato do usuário',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (padrão: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite de itens por página (padrão: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Termo de busca por nome',
    example: 'Alpha',
  })
  @ApiQuery({
    name: 'tipoEquipeId',
    required: false,
    type: Number,
    description: 'Filtro por ID do tipo de equipe',
    example: 1,
  })
  @ApiQuery({
    name: 'contratoId',
    required: false,
    type: Number,
    description: 'Filtro por ID do contrato',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de equipes retornada com sucesso',
    type: EquipeListResponseDto,
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
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para acessar o contrato especificado',
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('tipoEquipeId') tipoEquipeId?: string,
    @Query('contratoId') contratoId?: string,
    @GetUserContracts() allowedContracts?: ContractPermission[]
  ): Promise<EquipeListResponseDto> {
    this.logger.log(
      `Listando equipes - Página: ${page}, Limite: ${limit}, Busca: ${
        search || 'N/A'
      }, TipoEquipe: ${tipoEquipeId || 'Todos'}, Contrato: ${
        contratoId || 'Todos'
      }`
    );

    const params = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      tipoEquipeId: tipoEquipeId ? parseInt(tipoEquipeId, 10) : undefined,
      contratoId: contratoId ? parseInt(contratoId, 10) : undefined,
    };

    return this.equipeService.findAll(params, allowedContracts);
  }

  /**
   * Busca equipe por ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Busca equipe por ID',
    description: 'Retorna uma equipe específica respeitando as permissões de contrato',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID da equipe',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Equipe encontrada com sucesso',
    type: EquipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Equipe não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para acessar esta equipe',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUserContracts() allowedContracts?: ContractPermission[]
  ): Promise<EquipeResponseDto> {
    this.logger.log(`Buscando equipe por ID: ${id}`);
    return this.equipeService.findOne(id, allowedContracts);
  }

  /**
   * Cria nova equipe
   */
  @Post()
  @ApiOperation({
    summary: 'Cria nova equipe',
    description: 'Cria uma nova equipe respeitando as permissões de contrato',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Equipe criada com sucesso',
    type: EquipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe uma equipe com este nome',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de equipe ou contrato não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para criar equipe neste contrato',
  })
  async create(
    @Body() createEquipeDto: CreateEquipeDto,
    @GetUserContracts() allowedContracts?: ContractPermission[]
  ): Promise<EquipeResponseDto> {
    this.logger.log(`Criando equipe: ${createEquipeDto.nome}`);
    return this.equipeService.create(createEquipeDto, allowedContracts);
  }

  /**
   * Atualiza equipe existente
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Atualiza equipe existente',
    description: 'Atualiza uma equipe existente respeitando as permissões de contrato',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID da equipe',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Equipe atualizada com sucesso',
    type: EquipeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Equipe não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe uma equipe com este nome',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para atualizar esta equipe',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipeDto: UpdateEquipeDto,
    @GetUserContracts() allowedContracts?: ContractPermission[]
  ): Promise<EquipeResponseDto> {
    this.logger.log(`Atualizando equipe ${id}`);
    return this.equipeService.update(id, updateEquipeDto, allowedContracts);
  }

  /**
   * Remove equipe (soft delete)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Remove equipe',
    description: 'Remove uma equipe (soft delete) respeitando as permissões de contrato',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID da equipe',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Equipe removida com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Equipe não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para remover esta equipe',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUserContracts() allowedContracts?: ContractPermission[]
  ): Promise<void> {
    this.logger.log(`Removendo equipe ${id}`);
    return this.equipeService.remove(id, allowedContracts);
  }

  /**
   * Conta equipes ativas
   */
  @Get('count')
  @ApiOperation({
    summary: 'Conta equipes ativas',
    description: 'Retorna o total de equipes ativas respeitando as permissões de contrato',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contagem de equipes retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Total de equipes ativas',
          example: 25,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  async count(
    @GetUserContracts() allowedContracts?: ContractPermission[]
  ): Promise<{ count: number }> {
    this.logger.log('Contando equipes ativas');
    const count = await this.equipeService.count(allowedContracts);
    return { count };
  }
}

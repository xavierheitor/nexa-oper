/**
 * Controller principal das escalas. Ele expõe endpoints REST completos para
 * CRUD, atribuição de eletricistas e geração de agendas.
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
  OptionalContractPermission,
  RequireContractPermission,
} from '@modules/engine/auth/decorators/contract-permission.decorator';
import { GetUserContracts } from '@modules/engine/auth/decorators/get-user-contracts.decorator';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
import { EscalaService } from '../services/escala.service';
import {
  CreateEscalaDto,
  EscalaAgendaQueryDto,
  EscalaAgendaResponseDto,
  EscalaAssignDto,
  EscalaListResponseDto,
  EscalaQueryDto,
  EscalaResponseDto,
  UpdateEscalaDto,
} from '../dto';

@ApiTags('escalas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('escalas')
export class EscalaController {
  private readonly logger = new Logger(EscalaController.name);

  constructor(private readonly escalaService: EscalaService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar escalas',
    description: 'Retorna lista paginada de escalas respeitando o contrato do usuário.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Página desejada', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por nome/código' })
  @ApiQuery({ name: 'contratoId', required: false, description: 'Filtrar por contrato', example: 5 })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por escalas ativas', example: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista retornada com sucesso',
    type: EscalaListResponseDto,
  })
  async findAll(
    @Query() query: EscalaQueryDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EscalaListResponseDto> {
    const params = this.escalaService.mapQueryDtoToParams(query);
    this.logger.log(`Listando escalas - Página ${params.page} - Limite ${params.limit}`);
    return this.escalaService.findAll(params, allowedContracts);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar escala por ID',
    description: 'Retorna os detalhes completos de uma escala.',
  })
  @ApiParam({ name: 'id', description: 'ID da escala', example: 1 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Escala retornada com sucesso',
    type: EscalaResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EscalaResponseDto> {
    this.logger.log(`Buscando escala ${id}`);
    return this.escalaService.findOne(id, allowedContracts);
  }

  @Post()
  @RequireContractPermission('contratoId', { bodyPath: 'contratoId' })
  @ApiOperation({
    summary: 'Criar nova escala',
    description: 'Cria uma escala com seus horários e configurações de ciclo.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Escala criada com sucesso',
    type: EscalaResponseDto,
  })
  async create(
    @Body() createEscalaDto: CreateEscalaDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EscalaResponseDto> {
    this.logger.log(`Criando escala ${createEscalaDto.nome}`);
    return this.escalaService.create(createEscalaDto, allowedContracts);
  }

  @Put(':id')
  @OptionalContractPermission('contratoId', { bodyPath: 'contratoId' })
  @ApiOperation({ summary: 'Atualizar escala', description: 'Atualiza os dados principais da escala.' })
  @ApiParam({ name: 'id', description: 'ID da escala', example: 1 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Escala atualizada', type: EscalaResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEscalaDto: UpdateEscalaDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EscalaResponseDto> {
    this.logger.log(`Atualizando escala ${id}`);
    return this.escalaService.update(id, updateEscalaDto, allowedContracts);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover escala', description: 'Realiza o soft delete da escala informada.' })
  @ApiParam({ name: 'id', description: 'ID da escala', example: 1 })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Escala removida' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<void> {
    this.logger.log(`Removendo escala ${id}`);
    await this.escalaService.remove(id, allowedContracts);
  }

  @Post(':id/alocacoes')
  @ApiOperation({
    summary: 'Atribuir eletricistas',
    description: 'Registra as alocações/rotação de eletricistas para os horários da escala.',
  })
  @ApiParam({ name: 'id', description: 'ID da escala', example: 1 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Alocações registradas', type: EscalaResponseDto })
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignDto: EscalaAssignDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EscalaResponseDto> {
    this.logger.log(`Atribuindo eletricistas à escala ${id}`);
    return this.escalaService.assignEletricistas(id, assignDto, allowedContracts);
  }

  @Get(':id/agenda')
  @ApiOperation({
    summary: 'Gerar agenda da escala',
    description: 'Calcula a agenda automática da escala em um intervalo de datas.',
  })
  @ApiParam({ name: 'id', description: 'ID da escala', example: 1 })
  @ApiQuery({ name: 'dataInicio', required: false, description: 'Data inicial (ISO)' })
  @ApiQuery({ name: 'dataFim', required: false, description: 'Data final (ISO)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agenda gerada com sucesso', type: EscalaAgendaResponseDto })
  async agenda(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: EscalaAgendaQueryDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EscalaAgendaResponseDto> {
    this.logger.log(`Gerando agenda da escala ${id}`);
    return this.escalaService.generateAgenda(id, query, allowedContracts);
  }
}

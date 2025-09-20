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
import { EletricistaService } from '../services/eletricista.service';
import {
  CreateEletricistaDto,
  EletricistaListResponseDto,
  EletricistaQueryDto,
  EletricistaResponseDto,
  UpdateEletricistaDto,
} from '../dto';

@ApiTags('eletricistas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('eletricistas')
export class EletricistaController {
  private readonly logger = new Logger(EletricistaController.name);

  constructor(private readonly eletricistaService: EletricistaService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar eletricistas',
    description:
      'Retorna lista paginada de eletricistas filtrando automaticamente pelos contratos permitidos ao usuário.',
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
    description: 'Termo de busca (nome, matrícula ou telefone)',
    example: 'joao',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado (UF)',
    example: 'MG',
  })
  @ApiQuery({
    name: 'contratoId',
    required: false,
    description: 'Filtrar por contrato específico',
    example: 12,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista retornada com sucesso',
    type: EletricistaListResponseDto,
  })
  async findAll(
    @Query() query: EletricistaQueryDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EletricistaListResponseDto> {
    const params = this.eletricistaService.mapQueryDtoToParams(query);
    this.logger.log(
      `Listando eletricistas - Página: ${params.page}, Limite: ${params.limit}`
    );
    return this.eletricistaService.findAll(params, allowedContracts);
  }

  @Get('count')
  @ApiOperation({
    summary: 'Contar eletricistas',
    description:
      'Retorna a quantidade de eletricistas ativos acessíveis para o usuário autenticado.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contagem retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Quantidade de eletricistas acessíveis',
          example: 25,
        },
      },
    },
  })
  async count(
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<{ count: number }> {
    const count = await this.eletricistaService.count(allowedContracts);
    return { count };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar eletricista por ID',
    description:
      'Retorna os dados de um eletricista específico respeitando as permissões de contrato do usuário.',
  })
  @ApiParam({ name: 'id', description: 'ID do eletricista', example: 101 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Eletricista encontrado',
    type: EletricistaResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EletricistaResponseDto> {
    this.logger.log(`Buscando eletricista ${id}`);
    return this.eletricistaService.findOne(id, allowedContracts);
  }

  @Post()
  @RequireContractPermission('contratoId', { bodyPath: 'contratoId' })
  @ApiOperation({
    summary: 'Criar eletricista',
    description:
      'Cria um novo eletricista vinculado a um contrato permitido para o usuário.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Eletricista criado com sucesso',
    type: EletricistaResponseDto,
  })
  async create(
    @Body() createEletricistaDto: CreateEletricistaDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EletricistaResponseDto> {
    this.logger.log(`Criando eletricista ${createEletricistaDto.matricula}`);
    return this.eletricistaService.create(
      createEletricistaDto,
      allowedContracts
    );
  }

  @Put(':id')
  @OptionalContractPermission('contratoId', { bodyPath: 'contratoId' })
  @ApiOperation({
    summary: 'Atualizar eletricista',
    description:
      'Atualiza os dados de um eletricista respeitando as permissões de contrato do usuário.',
  })
  @ApiParam({ name: 'id', description: 'ID do eletricista', example: 101 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Eletricista atualizado com sucesso',
    type: EletricistaResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEletricistaDto: UpdateEletricistaDto,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EletricistaResponseDto> {
    this.logger.log(`Atualizando eletricista ${id}`);
    return this.eletricistaService.update(
      id,
      updateEletricistaDto,
      allowedContracts
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover eletricista',
    description:
      'Realiza o soft delete de um eletricista respeitando as permissões de contrato do usuário.',
  })
  @ApiParam({ name: 'id', description: 'ID do eletricista', example: 101 })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Eletricista removido com sucesso',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<void> {
    this.logger.log(`Removendo eletricista ${id}`);
    await this.eletricistaService.remove(id, allowedContracts);
  }
}

/**
 * Controlador de Checklists - CRUD
 *
 * Este controlador gerencia exclusivamente as operações CRUD relacionadas
 * aos checklists de segurança, incluindo listagem paginada, criação,
 * atualização e exclusão lógica.
 *
 * RESPONSABILIDADES:
 * - Gerenciar endpoints CRUD de checklists
 * - Validar dados de entrada via DTOs
 * - Documentar APIs via Swagger
 * - Tratar erros de forma padronizada
 * - Implementar logging estruturado
 * - Gerenciar paginação, busca e filtros
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/checklist/modelos - Lista checklists (paginado)
 * - GET /api/checklist/modelos/:id - Busca checklist específico
 * - GET /api/checklist/modelos/count - Conta total de checklists ativos
 *
 * Criação, atualização e exclusão são feitas no web.
 *
 * PADRÕES IMPLEMENTADOS:
 * - Documentação Swagger completa
 * - Validação automática via class-validator
 * - Tipagem TypeScript rigorosa
 * - Tratamento de erros HTTP padronizado
 * - Logging de operações críticas
 * - Paginação com metadados
 *
 * @example
 * ```bash
 * # Listar checklists com paginação
 * curl "http://localhost:3001/api/checklist/modelos?page=1&limit=10&search=partida"
 *
 * # Buscar checklist específico
 * curl http://localhost:3001/api/checklist/modelos/1
 * ```
 */

import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
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
  ChecklistListResponseDto,
  ChecklistQueryDto,
  ChecklistResponseDto,
} from '../dto';
import { ChecklistService } from '../services/checklist.service';

/**
 * Controlador de Checklists - CRUD
 */
@ApiTags('checklist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checklist')
export class ChecklistController {
  private readonly logger = new Logger(ChecklistController.name);

  constructor(private readonly checklistService: ChecklistService) {}

  /**
   * Lista todos os checklists com paginação, busca e filtro por tipo
   */
  @Get('modelos')
  @ApiOperation({
    summary: 'Listar checklists',
    description:
      'Retorna lista paginada de checklists com possibilidade de busca e filtro por tipo',
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
    example: 'partida',
  })
  @ApiQuery({
    name: 'tipoChecklistId',
    required: false,
    description: 'ID do tipo de checklist para filtrar',
    example: 3,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de checklists retornada com sucesso',
    type: ChecklistListResponseDto,
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
  async findAll(
    @Query() query: ChecklistQueryDto
  ): Promise<ChecklistListResponseDto> {
    const { page = 1, limit = 10, search, tipoChecklistId } = query;

    this.logger.log(
      `Listando checklists - Página: ${page}, Limite: ${limit}, Busca: ${
        search || 'N/A'
      }, TipoChecklist: ${tipoChecklistId ?? 'Todos'}`
    );

    return this.checklistService.findAll({
      page,
      limit,
      search,
      tipoChecklistId,
    });
  }

  /**
   * Busca checklist por ID
   */
  @Get('modelos/:id')
  @ApiOperation({
    summary: 'Buscar checklist por ID',
    description: 'Retorna um checklist específico baseado no ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do checklist',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checklist encontrado com sucesso',
    type: ChecklistResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Checklist não encontrado',
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
  ): Promise<ChecklistResponseDto> {
    this.logger.log(`Buscando checklist por ID: ${id}`);
    return this.checklistService.findOne(id);
  }

  /**
   * Conta total de checklists ativos
   */
  @Get('modelos/count')
  @ApiOperation({
    summary: 'Contar checklists',
    description: 'Retorna o número total de checklists ativos',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contagem retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Número total de checklists ativos',
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
    this.logger.log('Contando checklists ativos');
    const count = await this.checklistService.count();
    return { count };
  }
}

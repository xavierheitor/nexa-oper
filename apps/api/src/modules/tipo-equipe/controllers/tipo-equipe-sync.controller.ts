/**
 * Controlador de Sincronização de Tipos de Equipe
 *
 * Este controlador gerencia exclusivamente os endpoints de sincronização
 * para clientes mobile, fornecendo dados completos sem paginação.
 *
 * RESPONSABILIDADES:
 * - Gerenciar endpoints de sincronização de tipos de equipe
 * - Fornecer dados completos para mobile
 * - Validar dados de entrada via DTOs
 * - Documentar APIs via Swagger
 * - Tratar erros de forma padronizada
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/tipo-equipe/sync - Sincronizar tipos de equipe
 *
 * PADRÕES IMPLEMENTADOS:
 * - Documentação Swagger completa
 * - Validação automática via class-validator
 * - Tipagem TypeScript rigorosa
 * - Tratamento de erros HTTP padronizado
 * - Logging de operações críticas
 * - Dados completos sem paginação para mobile
 *
 * @example
 * ```bash
 * # Sincronizar tipos de equipe
 * curl http://localhost:3001/api/tipo-equipe/sync
 * ```
 */

import { SyncAuditRemoverInterceptor } from '@common/interceptors';
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { TipoEquipeSyncDto } from '../dto';
import { TipoEquipeService } from '../services/tipo-equipe.service';

/**
 * Controlador de Sincronização de Tipos de Equipe
 *
 * Gerencia exclusivamente os endpoints de sincronização para clientes mobile,
 * fornecendo dados completos sem paginação para manter sincronia offline.
 *
 * SEGURANÇA:
 * - Todas as rotas requerem autenticação JWT
 * - Token deve ser enviado no header Authorization: Bearer <token>
 * - Retorna 401 Unauthorized para requisições não autenticadas
 *
 * PERFORMANCE:
 * - Dados retornados sem paginação para facilitar sincronização
 * - Ordenação otimizada para mobile (updatedAt desc)
 * - Campos de auditoria incluídos para controle de versão
 */
@ApiTags('tipo-equipe-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(SyncAuditRemoverInterceptor)
@Controller('tipo-equipe/sync')
export class TipoEquipeSyncController {
  private readonly logger = new Logger(TipoEquipeSyncController.name);

  constructor(private readonly tipoEquipeService: TipoEquipeService) {}

  /**
   * Retorna todos os tipos de equipe para sincronização mobile
   *
   * Endpoint para sincronização de tipos de equipe.
   * Retorna dados completos sem paginação para facilitar
   * a sincronização offline dos clientes mobile.
   *
   * @returns Lista completa de tipos de equipe ativos
   */
  @Get()
  @ApiOperation({
    summary: 'Sincronizar tipos de equipe',
    description:
      'Retorna todos os tipos de equipe ativos para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de equipe retornada com sucesso',
    type: [TipoEquipeSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncTipos(): Promise<TipoEquipeSyncDto[]> {
    this.logger.log('Iniciando sincronização de tipos de equipe');

    try {
      const result = await this.tipoEquipeService.findAllForSync();
      this.logger.log(
        `Sincronização concluída com ${result.length} tipos de equipe`
      );
      return result;
    } catch (error) {
      this.logger.error('Erro na sincronização de tipos de equipe:', error);
      throw error;
    }
  }
}

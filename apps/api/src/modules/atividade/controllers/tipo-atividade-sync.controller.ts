/**
 * Controlador de Sincronização de Tipos de Atividade
 *
 * Este controlador gerencia exclusivamente os endpoints de sincronização
 * para clientes mobile, fornecendo dados completos sem paginação.
 *
 * RESPONSABILIDADES:
 * - Gerenciar endpoints de sincronização de tipos de atividade
 * - Fornecer dados completos para mobile
 * - Validar dados de entrada via DTOs
 * - Documentar APIs via Swagger
 * - Tratar erros de forma padronizada
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/atividade/sync/tipos - Sincronizar tipos de atividade
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
 * # Sincronizar tipos de atividade
 * curl http://localhost:3001/api/atividade/sync/tipos
 * ```
 */

import { SyncAuditRemoverInterceptor } from '@common/interceptors';
import { GetUserContracts } from '@modules/engine/auth/decorators/get-user-contracts.decorator';
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
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

import { TipoAtividadeSyncDto } from '../dto';
import { TipoAtividadeService } from '../services/tipo-atividade.service';

/**
 * Controlador de Sincronização de Tipos de Atividade
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
@ApiTags('atividade-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(SyncAuditRemoverInterceptor)
@Controller('atividade/sync')
export class TipoAtividadeSyncController {
  private readonly logger = new Logger(TipoAtividadeSyncController.name);

  constructor(private readonly tipoAtividadeService: TipoAtividadeService) {}

  /**
   * Retorna todos os tipos de atividade para sincronização mobile
   *
   * Endpoint para sincronização de tipos de atividade.
   * Retorna dados completos sem paginação para facilitar
   * a sincronização offline dos clientes mobile.
   *
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Lista completa de tipos de atividade ativos
   */
  @Get('tipos')
  @ApiOperation({
    summary: 'Sincronizar tipos de atividade',
    description:
      'Retorna todos os tipos de atividade ativos para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de atividade retornada com sucesso',
    type: [TipoAtividadeSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncTipos(
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<TipoAtividadeSyncDto[]> {
    this.logger.log('Iniciando sincronização de tipos de atividade');
    return this.tipoAtividadeService.findAllForSync(allowedContracts);
  }
}

/**
 * Controlador de Sincronização de Tipos de Veículo
 *
 * Este controlador gerencia exclusivamente os endpoints de sincronização
 * para clientes mobile, fornecendo dados completos sem paginação.
 *
 * RESPONSABILIDADES:
 * - Gerenciar endpoints de sincronização de tipos de veículo
 * - Fornecer dados completos para mobile
 * - Validar dados de entrada via DTOs
 * - Documentar APIs via Swagger
 * - Tratar erros de forma padronizada
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/tipo-veiculo/sync - Sincronizar tipos de veículo
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
 * # Sincronizar tipos de veículo
 * curl http://localhost:3001/api/tipo-veiculo/sync
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

import { TipoVeiculoSyncDto } from '../dto';
import { TipoVeiculoService } from '../services/tipo-veiculo.service';

/**
 * Controlador de Sincronização de Tipos de Veículo
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
@ApiTags('tipo-veiculo-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(SyncAuditRemoverInterceptor)
@Controller('tipo-veiculo/sync')
export class TipoVeiculoSyncController {
  private readonly logger = new Logger(TipoVeiculoSyncController.name);

  constructor(private readonly tipoVeiculoService: TipoVeiculoService) {}

  /**
   * Retorna todos os tipos de veículo para sincronização mobile
   *
   * Endpoint para sincronização de tipos de veículo.
   * Retorna dados completos sem paginação para facilitar
   * a sincronização offline dos clientes mobile.
   *
   * @returns Lista completa de tipos de veículo ativos
   */
  @Get()
  @ApiOperation({
    summary: 'Sincronizar tipos de veículo',
    description:
      'Retorna todos os tipos de veículo ativos para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de veículo retornada com sucesso',
    type: [TipoVeiculoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncTipos(): Promise<TipoVeiculoSyncDto[]> {
    this.logger.log('Iniciando sincronização de tipos de veículo');

    try {
      const result = await this.tipoVeiculoService.findAllForSync();
      this.logger.log(
        `Sincronização concluída com ${result.length} tipos de veículo`
      );
      return result;
    } catch (error) {
      this.logger.error('Erro na sincronização de tipos de veículo:', error);
      throw error;
    }
  }
}

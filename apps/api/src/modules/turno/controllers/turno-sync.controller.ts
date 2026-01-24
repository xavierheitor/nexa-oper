/**
 * Controlador de Sincronização de Turnos
 *
 * Este controlador gerencia exclusivamente os endpoints de sincronização
 * para clientes mobile, fornecendo dados completos sem paginação.
 *
 * RESPONSABILIDADES:
 * - Gerenciar endpoints de sincronização de turnos
 * - Fornecer dados completos para mobile
 * - Validar dados de entrada via DTOs
 * - Documentar APIs via Swagger
 * - Tratar erros de forma padronizada
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/turnos/sync - Sincronizar turnos
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
 * # Sincronizar turnos
 * curl http://localhost:3001/api/turnos/sync
 * ```
 */

import { SyncEndpoint } from '@common/decorators';
import { GetUserContracts } from '@core/auth/decorators/get-user-contracts.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { ContractPermission } from '@core/auth/services/contract-permissions.service';
import { Controller, Get, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { TurnoSyncDto } from '../dto';
import { TurnoService } from '../services/turno.service';

/**
 * Controlador de Sincronização de Turnos
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
@SyncEndpoint('turnos-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('turnos/sync')
export class TurnoSyncController {
  private readonly logger = new Logger(TurnoSyncController.name);

  constructor(private readonly turnoService: TurnoService) {}

  /**
   * Retorna todos os turnos para sincronização mobile
   *
   * Endpoint para sincronização de turnos.
   * Retorna dados completos sem paginação para facilitar
   * a sincronização offline dos clientes mobile.
   *
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Lista completa de turnos ativos
   */
  @Get()
  @ApiOperation({
    summary: 'Sincronizar turnos',
    description: 'Retorna todos os turnos ativos para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de turnos retornada com sucesso',
    type: [TurnoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncTurnos(
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<TurnoSyncDto[]> {
    this.logger.log('Iniciando sincronização de turnos');
    return this.turnoService.findAllForSync(allowedContracts);
  }
}

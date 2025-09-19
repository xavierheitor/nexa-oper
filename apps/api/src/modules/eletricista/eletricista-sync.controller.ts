/**
 * Controlador de Sincronização de Eletricistas
 *
 * Fornece endpoints específicos para clientes mobile sincronizarem
 * a base completa de eletricistas respeitando as permissões de contrato
 * do usuário autenticado.
 */

import { Controller, Get, HttpStatus, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../engine/auth/guard/jwt-auth.guard';
import { GetUserContracts } from '../engine/auth/decorator/get-user-contracts.decorator';
import { ContractPermission } from '../engine/auth/service/contract-permissions.service';
import { SyncAuditRemoverInterceptor } from '../../shared/interceptors';
import { EletricistaService } from './eletricista.service';
import { EletricistaSyncDto } from './dto';

@ApiTags('eletricistas-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(SyncAuditRemoverInterceptor)
@Controller('eletricistas/sync')
export class EletricistaSyncController {
  private readonly logger = new Logger(EletricistaSyncController.name);

  constructor(private readonly eletricistaService: EletricistaService) {}

  /**
   * Retorna todos os eletricistas permitidos para sincronização mobile
   */
  @Get()
  @ApiOperation({
    summary: 'Sincronizar eletricistas',
    description:
      'Retorna todos os eletricistas permitidos para sincronização mobile, ' +
      'respeitando as permissões de contrato do usuário autenticado. ' +
      'Dados retornados sem paginação para facilitar sincronização offline.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de eletricistas retornada com sucesso',
    type: [EletricistaSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para acessar eletricistas',
  })
  async sync(
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EletricistaSyncDto[]> {
    this.logger.debug('=== INÍCIO DO MÉTODO sync ===');
    this.logger.debug(`Timestamp: ${new Date().toISOString()}`);
    this.logger.debug(`Método: ${this.sync.name}`);
    this.logger.debug(`Controller: ${EletricistaSyncController.name}`);

    this.logger.debug('=== PARÂMETROS RECEBIDOS ===');
    this.logger.debug(
      `allowedContracts recebido: ${JSON.stringify(allowedContracts)}`
    );
    this.logger.debug(`Tipo de allowedContracts: ${typeof allowedContracts}`);
    this.logger.debug(`É array: ${Array.isArray(allowedContracts)}`);
    this.logger.debug(
      `Quantidade de contratos: ${allowedContracts?.length || 0}`
    );

    if (allowedContracts && allowedContracts.length > 0) {
      this.logger.debug('=== DETALHES DOS CONTRATOS ===');
      allowedContracts.forEach((contract, index) => {
        this.logger.debug(`Contrato ${index + 1}: ${JSON.stringify(contract)}`);
      });
    }

    this.logger.log(
      `Sincronizando eletricistas para ${allowedContracts?.length || 0} contratos`
    );

    try {
      this.logger.debug('=== CHAMANDO SERVICE ===');
      this.logger.debug('Chamando eletricistaService.findAllForSync...');

      const result =
        await this.eletricistaService.findAllForSync(allowedContracts);

      this.logger.debug('=== RESULTADO DO SERVICE ===');
      this.logger.debug(`Resultado recebido: ${JSON.stringify(result)}`);
      this.logger.debug(`Tipo do resultado: ${typeof result}`);
      this.logger.debug(`É array: ${Array.isArray(result)}`);
      this.logger.debug(`Quantidade de eletricistas: ${result?.length || 0}`);

      this.logger.log(
        `Sincronização concluída - ${result?.length || 0} eletricistas retornados`
      );

      this.logger.debug('=== RETORNANDO RESULTADO ===');
      this.logger.debug('=== FIM DO MÉTODO sync ===');

      return result;
    } catch (error) {
      this.logger.error('=== ERRO NA SINCRONIZAÇÃO ===');
      this.logger.error(`Erro capturado: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      this.logger.error(`Nome do erro: ${error.name}`);
      this.logger.error(`Código do erro: ${error.code}`);
      this.logger.error('=== FIM DO ERRO ===');
      throw error;
    }
  }
}

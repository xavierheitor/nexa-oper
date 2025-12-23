/**
 * Handler para a Query GetTurnosForSyncQuery
 *
 * Implementa o padrão CQRS separando operações de leitura (Queries)
 * das operações de escrita (Commands).
 *
 * RESPONSABILIDADES:
 * - Processar query de sincronização de turnos
 * - Executar lógica de leitura otimizada
 * - Permitir cache e otimizações
 * - Não modificar estado do sistema
 *
 * @example
 * ```typescript
 * @QueryHandler(GetTurnosForSyncQuery)
 * export class GetTurnosForSyncHandler implements IQueryHandler<GetTurnosForSyncQuery> {
 *   async execute(query: GetTurnosForSyncQuery) { ... }
 * }
 * ```
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetTurnosForSyncQuery } from '../queries/get-turnos-for-sync.query';
import { TurnoService } from '../../services/turno.service';
import { TurnoSyncDto } from '../../dto/turno-sync.dto';

/**
 * Handler responsável por processar a query de sincronização de turnos
 */
@QueryHandler(GetTurnosForSyncQuery)
export class GetTurnosForSyncHandler
  implements IQueryHandler<GetTurnosForSyncQuery>
{
  private readonly logger = new Logger(GetTurnosForSyncHandler.name);

  constructor(private readonly turnoService: TurnoService) {}

  /**
   * Executa a query de sincronização de turnos
   *
   * @param query - Query de sincronização de turnos
   * @returns Lista completa de turnos para sincronização
   */
  async execute(query: GetTurnosForSyncQuery): Promise<TurnoSyncDto[]> {
    this.logger.log('Executando query GetTurnosForSyncQuery');

    // Executa a lógica de leitura através do serviço
    // Esta operação pode ser otimizada com cache
    const result = await this.turnoService.findAllForSync(
      query.allowedContracts
    );

    this.logger.log(
      `Query GetTurnosForSyncQuery executada com sucesso - ${result.length} registros retornados`
    );

    return result;
  }
}


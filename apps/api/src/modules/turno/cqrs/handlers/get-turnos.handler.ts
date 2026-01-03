/**
 * Handler para a Query GetTurnosQuery
 *
 * Implementa o padrão CQRS separando operações de leitura (Queries)
 * das operações de escrita (Commands).
 *
 * RESPONSABILIDADES:
 * - Processar query de listagem de turnos
 * - Executar lógica de leitura otimizada
 * - Permitir cache e otimizações
 * - Não modificar estado do sistema
 *
 * @example
 * ```typescript
 * @QueryHandler(GetTurnosQuery)
 * export class GetTurnosHandler implements IQueryHandler<GetTurnosQuery> {
 *   async execute(query: GetTurnosQuery) { ... }
 * }
 * ```
 */

import { Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';

import { TurnoListResponseDto } from '../../dto/turno-list-response.dto';
import { TurnoService } from '../../services/turno.service';
import { GetTurnosQuery } from '../queries/get-turnos.query';

/**
 * Handler responsável por processar a query de listagem de turnos
 */
@QueryHandler(GetTurnosQuery)
export class GetTurnosHandler implements IQueryHandler<GetTurnosQuery> {
  private readonly logger = new Logger(GetTurnosHandler.name);

  constructor(private readonly turnoService: TurnoService) {}

  /**
   * Executa a query de listagem de turnos
   *
   * @param query - Query de listagem de turnos
   * @returns Lista paginada de turnos
   */
  async execute(query: GetTurnosQuery): Promise<TurnoListResponseDto> {
    this.logger.log(
      `Executando query GetTurnosQuery - página: ${query.params.page}, limite: ${query.params.limit}`
    );

    // Executa a lógica de leitura através do serviço
    // Esta operação pode ser otimizada com cache
    const result = await this.turnoService.findAll(
      query.params,
      query.allowedContracts
    );

    this.logger.log(
      `Query GetTurnosQuery executada com sucesso - ${result.data.length} registros retornados`
    );

    return result;
  }
}

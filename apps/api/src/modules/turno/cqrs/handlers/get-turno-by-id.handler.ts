/**
 * Handler para a Query GetTurnoByIdQuery
 *
 * Implementa o padrão CQRS separando operações de leitura (Queries)
 * das operações de escrita (Commands).
 *
 * RESPONSABILIDADES:
 * - Processar query de busca de turno por ID
 * - Executar lógica de leitura otimizada
 * - Permitir cache e otimizações
 * - Não modificar estado do sistema
 *
 * @example
 * ```typescript
 * @QueryHandler(GetTurnoByIdQuery)
 * export class GetTurnoByIdHandler implements IQueryHandler<GetTurnoByIdQuery> {
 *   async execute(query: GetTurnoByIdQuery) { ... }
 * }
 * ```
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetTurnoByIdQuery } from '../queries/get-turno-by-id.query';
import { TurnoService } from '../../services/turno.service';
import { TurnoResponseDto } from '../../dto/turno-response.dto';

/**
 * Handler responsável por processar a query de busca de turno por ID
 */
@QueryHandler(GetTurnoByIdQuery)
export class GetTurnoByIdHandler implements IQueryHandler<GetTurnoByIdQuery> {
  private readonly logger = new Logger(GetTurnoByIdHandler.name);

  constructor(private readonly turnoService: TurnoService) {}

  /**
   * Executa a query de busca de turno por ID
   *
   * @param query - Query de busca de turno por ID
   * @returns Turno encontrado
   */
  async execute(query: GetTurnoByIdQuery): Promise<TurnoResponseDto> {
    this.logger.log(
      `Executando query GetTurnoByIdQuery - ID: ${query.id}`
    );

    // Executa a lógica de leitura através do serviço
    // Esta operação pode ser otimizada com cache
    const result = await this.turnoService.findOne(
      query.id,
      query.allowedContracts
    );

    this.logger.log(
      `Query GetTurnoByIdQuery executada com sucesso - Turno ID: ${result.id}`
    );

    return result;
  }
}


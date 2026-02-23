import type { PrismaService } from '../../../../database/prisma.service';
import type { AbrirTurnoDto } from '../../dto/abrir-turno.dto';
import type { FecharTurnoDto } from '../../dto/fechar-turno.dto';
import type { TurnoDetalheDto } from '../../dto/turno-detalhe.dto';
import type { TurnoQueryDto } from '../../dto/turno-query.dto';
import type { TurnoResponseDto } from '../../dto/turno-response.dto';

export const TURNO_REPOSITORY = Symbol('TURNO_REPOSITORY');

/**
 * Porta de repositório para escrita de turno.
 * A implementação concreta atual é Prisma (TurnoRepository).
 */
export interface TurnoRepositoryPort {
  createTurno(dto: AbrirTurnoDto, tx?: PrismaService): Promise<TurnoDetalheDto>;
  closeTurno(dto: FecharTurnoDto): Promise<TurnoResponseDto>;
  listTurnos(query: TurnoQueryDto): Promise<{
    items: TurnoResponseDto[];
    meta: { total: number; page: number; limit: number };
  }>;
  findTurnoById(
    id: number,
    detailed?: boolean,
  ): Promise<TurnoResponseDto | TurnoDetalheDto | null>;
  findTurnosForSync(since?: Date, limit?: number): Promise<TurnoDetalheDto[]>;
}

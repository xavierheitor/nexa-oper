import type { EventEmitter2 } from '@nestjs/event-emitter';
import type { PrismaService } from '../../../../database/prisma.service';
import type { AppLogger } from '../../../../core/logger/app-logger';
import type { AbrirTurnoRequestContract } from '../../../../contracts/turno/abrir-turno.contract';
import type { ChecklistPreenchidoService } from '../../checklist-preenchido/checklist-preenchido.service';
import type { TurnoRepositoryPort } from '../../domain/repositories/turno-repository.port';
import { OpenTurnoUseCase } from './open-turno.use-case';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

interface SqlQueryLike {
  strings: string[];
  values: unknown[];
}

interface TurnoSnapshot {
  id: number;
  dataInicio: Date;
  dataFim: Date | null;
  veiculoId: number;
  equipeId: number;
  eletricistaIds: number[];
}

class TurnoTransactionPrismaFake {
  private txSeq = 0;
  private nextTurnoId = 1;
  private readonly lockOwner = new Map<string, number>();
  private readonly lockQueue = new Map<string, Array<() => void>>();
  private readonly txLocks = new Map<number, Set<string>>();

  private readonly existingVeiculos = new Set([1]);
  private readonly existingEquipes = new Set([10]);
  private readonly existingEletricistas = new Set([100]);

  private readonly turnos: TurnoSnapshot[] = [];

  async $transaction<T>(
    callback: (tx: PrismaService) => Promise<T>,
  ): Promise<T> {
    const txId = ++this.txSeq;
    const tx = this.createTx(txId) as unknown as PrismaService;

    try {
      return await callback(tx);
    } finally {
      this.releaseTxLocks(txId);
    }
  }

  createTurnoFromDto(dto: AbrirTurnoRequestContract) {
    const id = this.nextTurnoId++;
    const dataInicio = dto.dataInicio ?? new Date();
    const snapshot: TurnoSnapshot = {
      id,
      dataInicio,
      dataFim: null,
      veiculoId: dto.veiculoId,
      equipeId: dto.equipeId,
      eletricistaIds: dto.eletricistas.map((e) => e.eletricistaId),
    };
    this.turnos.push(snapshot);

    return {
      id,
      dataInicio,
      dataFim: null,
      status: 'ABERTO',
      kmInicio: dto.kmInicio,
      kmFim: null,
      veiculo: { id: dto.veiculoId, nome: 'VEI-001' },
      equipe: { id: dto.equipeId, nome: 'Equipe A' },
      dispositivo: dto.dispositivo,
      versaoApp: dto.versaoApp,
      createdAt: new Date(),
      updatedAt: null,
      createdBy: 'system',
      updatedBy: null,
      eletricistas: dto.eletricistas.map((e) => ({
        eletricistaId: e.eletricistaId,
        motorista: !!e.motorista,
      })),
      checklists: [],
      turnosRealizados: [],
    };
  }

  private createTx(txId: number) {
    return {
      $queryRaw: <T>(query: SqlQueryLike) => this.queryRaw<T>(txId, query),
      turno: {
        findFirst: (args: { where?: Record<string, unknown> }) =>
          this.findTurnoConflict(args.where ?? {}),
      },
    };
  }

  private async queryRaw<T>(txId: number, query: SqlQueryLike): Promise<T> {
    const sql = query.strings.join(' ').toLowerCase();
    const values = query.values
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v));

    if (sql.includes('from veiculo')) {
      const id = values[0];
      await this.acquire(txId, `veiculo:${id}`);
      return (this.existingVeiculos.has(id) ? [{ id }] : []) as T;
    }

    if (sql.includes('from equipe')) {
      const id = values[0];
      await this.acquire(txId, `equipe:${id}`);
      return (this.existingEquipes.has(id) ? [{ id }] : []) as T;
    }

    if (sql.includes('from eletricista')) {
      const ids = [...new Set(values)].sort((a, b) => a - b);
      for (const id of ids) {
        await this.acquire(txId, `eletricista:${id}`);
      }
      return ids
        .filter((id) => this.existingEletricistas.has(id))
        .map((id) => ({ id })) as T;
    }

    throw new Error(`Unexpected raw query in test double: ${sql}`);
  }

  private findTurnoConflict(where: Record<string, unknown>) {
    const dataInicio = (where.dataInicio ?? {}) as {
      gte?: Date;
      lte?: Date;
    };

    const orClauses = Array.isArray(where.OR)
      ? (where.OR as Record<string, unknown>[])
      : [];

    let veiculoId: number | undefined;
    let equipeId: number | undefined;
    let eletricistaIds: number[] = [];

    for (const clause of orClauses) {
      if (typeof clause.veiculoId === 'number') veiculoId = clause.veiculoId;
      if (typeof clause.equipeId === 'number') equipeId = clause.equipeId;

      const inIds = (
        clause.TurnoEletricistas as
          | {
              some?: {
                eletricistaId?: {
                  in?: number[];
                };
              };
            }
          | undefined
      )?.some?.eletricistaId?.in;

      if (Array.isArray(inIds)) eletricistaIds = inIds;
    }

    const conflict = this.turnos.find((turno) => {
      if (turno.dataFim != null) return false;

      const insideDayWindow =
        (!dataInicio.gte || turno.dataInicio >= dataInicio.gte) &&
        (!dataInicio.lte || turno.dataInicio <= dataInicio.lte);
      if (!insideDayWindow) return false;

      if (veiculoId != null && turno.veiculoId === veiculoId) return true;
      if (equipeId != null && turno.equipeId === equipeId) return true;
      if (eletricistaIds.some((id) => turno.eletricistaIds.includes(id))) {
        return true;
      }
      return false;
    });

    return conflict ? { id: conflict.id } : null;
  }

  private async acquire(txId: number, key: string): Promise<void> {
    while (true) {
      const owner = this.lockOwner.get(key);
      if (owner == null || owner === txId) {
        this.lockOwner.set(key, txId);
        const locks = this.txLocks.get(txId) ?? new Set<string>();
        locks.add(key);
        this.txLocks.set(txId, locks);
        return;
      }

      await new Promise<void>((resolve) => {
        const queue = this.lockQueue.get(key) ?? [];
        queue.push(resolve);
        this.lockQueue.set(key, queue);
      });
    }
  }

  private releaseTxLocks(txId: number): void {
    const locks = this.txLocks.get(txId);
    if (!locks) return;

    for (const key of locks) {
      if (this.lockOwner.get(key) === txId) {
        this.lockOwner.delete(key);
      }

      const queue = this.lockQueue.get(key);
      const next = queue?.shift();
      if (!queue?.length) this.lockQueue.delete(key);
      next?.();
    }

    this.txLocks.delete(txId);
  }
}

describe('OpenTurnoUseCase (concurrency)', () => {
  it('allows only one turno opening when two requests race with same resources', async () => {
    const prisma = new TurnoTransactionPrismaFake();

    const repo: Pick<TurnoRepositoryPort, 'createTurno'> = {
      createTurno: jest.fn(async (dto) => {
        const created = prisma.createTurnoFromDto(dto);
        // Mantém a transação vencedora aberta por alguns ms para a outra ficar bloqueada no lock.
        await sleep(40);
        return created as never;
      }),
    };

    const logger: Pick<AppLogger, 'operation'> = {
      operation: jest.fn(),
    };

    const checklistPreenchidoService: Pick<
      ChecklistPreenchidoService,
      'salvarChecklistsDoTurno'
    > = {
      salvarChecklistsDoTurno: jest.fn(),
    };

    const eventEmitter: Pick<EventEmitter2, 'emit'> = {
      emit: jest.fn(),
    };

    const useCase = new OpenTurnoUseCase(
      repo as TurnoRepositoryPort,
      prisma as unknown as PrismaService,
      logger as AppLogger,
      checklistPreenchidoService as ChecklistPreenchidoService,
      eventEmitter as EventEmitter2,
    );

    const input: AbrirTurnoRequestContract = {
      veiculoId: 1,
      equipeId: 10,
      kmInicio: 1000,
      dataInicio: new Date('2026-02-22T10:00:00.000Z'),
      eletricistas: [{ eletricistaId: 100, motorista: true }],
    };

    const results = await Promise.allSettled([
      useCase.execute(input),
      useCase.execute(input),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatchObject({
      code: 'CONFLICT',
      status: 409,
      message:
        'Já existe um turno aberto para o veículo, equipe ou eletricista neste dia',
    });

    expect(repo.createTurno).toHaveBeenCalledTimes(1);
    expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
  });
});

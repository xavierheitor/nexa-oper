import type { Prisma } from '@nexa-oper/db';
import type { AppLogger } from '../../../core/logger/app-logger';
import type { PrismaService } from '../../../database/prisma.service';
import type { ChecklistPreenchidoService } from './checklist-preenchido.service';
import { TurnoChecklistSyncQueueService } from './turno-checklist-sync-queue.service';

describe('TurnoChecklistSyncQueueService', () => {
  const makeSut = () => {
    const prisma = {
      turnoChecklistSyncQueue: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const checklistPreenchidoService = {
      salvarChecklistsDoTurno: jest.fn(),
      processarChecklistsAssincrono: jest.fn(),
    };

    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<AppLogger>;

    const sut = new TurnoChecklistSyncQueueService(
      prisma as unknown as PrismaService,
      checklistPreenchidoService as unknown as ChecklistPreenchidoService,
      logger,
    );

    return {
      sut,
      prisma: prisma as {
        turnoChecklistSyncQueue: {
          create: jest.Mock;
          findMany: jest.Mock;
          findUnique: jest.Mock;
          updateMany: jest.Mock;
          update: jest.Mock;
        };
      },
      checklistPreenchidoService: checklistPreenchidoService as {
        salvarChecklistsDoTurno: jest.Mock;
        processarChecklistsAssincrono: jest.Mock;
      },
      logger,
    };
  };

  it('enfileira payload dentro da transação', async () => {
    const { sut, prisma } = makeSut();
    const tx = {
      turnoChecklistSyncQueue: {
        create: jest.fn().mockResolvedValue({ id: 9 }),
      },
    } as unknown as Prisma.TransactionClient;

    const queueId = await sut.enqueueInTransaction(tx, {
      turnoId: 12,
      createdBy: '99',
      checklists: [
        {
          uuid: '550e8400-e29b-41d4-a716-446655440000',
          checklistId: 1,
          eletricistaId: 2,
          respostas: [{ perguntaId: 3, opcaoRespostaId: 4 }],
        },
      ],
    });

    expect(queueId).toBe(9);
    expect(tx.turnoChecklistSyncQueue.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          turnoId: 12,
          createdBy: '99',
        }),
      }),
    );
  });

  it('marca item como completed após salvar checklists', async () => {
    const { sut, prisma, checklistPreenchidoService } = makeSut();

    prisma.turnoChecklistSyncQueue.updateMany.mockResolvedValue({ count: 1 });
    prisma.turnoChecklistSyncQueue.findUnique.mockResolvedValue({
      id: 1,
      turnoId: 12,
      createdBy: 'system',
      attemptCount: 0,
      maxAttempts: 10,
      payload: [
        {
          uuid: '550e8400-e29b-41d4-a716-446655440000',
          checklistId: 1,
          eletricistaId: 2,
          respostas: [{ perguntaId: 3, opcaoRespostaId: 4 }],
        },
      ] as unknown as Prisma.JsonValue,
    });
    checklistPreenchidoService.salvarChecklistsDoTurno.mockResolvedValue({
      checklistPreenchidoIds: [100],
      respostasAguardandoFoto: [200],
    });

    await sut.processDueItems({ turnoId: 12, limit: 1 });

    expect(checklistPreenchidoService.salvarChecklistsDoTurno).toHaveBeenCalled();
    expect(
      checklistPreenchidoService.processarChecklistsAssincrono,
    ).toHaveBeenCalledWith([100]);
    expect(prisma.turnoChecklistSyncQueue.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'completed',
          checklistPreenchidoIds: [100],
        }),
      }),
    );
  });
});

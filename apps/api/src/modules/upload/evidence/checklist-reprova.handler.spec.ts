import { AppError } from '../../../core/errors/app-error';
import { ChecklistReprovaEvidenceHandler } from './checklist-reprova.handler';

describe('ChecklistReprovaEvidenceHandler', () => {
  const prisma = {
    checklistPreenchido: {
      findFirst: jest.fn(),
    },
    checklistResposta: {
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    checklistRespostaFoto: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    checklistPendencia: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    uploadEvidence: {
      create: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const logger = {
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  const linkService = {
    upsertFromEvidence: jest.fn(),
  };

  const handler = new ChecklistReprovaEvidenceHandler(
    prisma as never,
    logger as never,
    linkService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts numeric metadata as strings', async () => {
    await expect(
      handler.validate({
        type: 'checklist-reprova',
        entityId: '7b4f6f4e-9927-40f5-a2cb-8ef9d4e4ac65',
        entityType: 'checklistPreenchido',
        metadata: {
          turnoId: '123',
          checklistPerguntaId: '456',
        },
      }),
    ).resolves.toBeUndefined();
  });

  it('rejects invalid numeric metadata', async () => {
    await expect(
      Promise.resolve().then(() =>
        handler.validate({
          type: 'checklist-reprova',
          entityId: '7b4f6f4e-9927-40f5-a2cb-8ef9d4e4ac65',
          entityType: 'checklistPreenchido',
          metadata: {
            turnoId: 'abc',
            checklistPerguntaId: '456',
          },
        }),
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('throws not found and does not persist evidence when checklist is missing', async () => {
    prisma.checklistPreenchido.findFirst.mockResolvedValue(null);

    await expect(
      handler.persist(
        {
          type: 'checklist-reprova',
          entityId: '7b4f6f4e-9927-40f5-a2cb-8ef9d4e4ac65',
          entityType: 'checklistPreenchido',
          metadata: {
            turnoId: 10,
            checklistPerguntaId: 22,
          },
        },
        {
          url: '/uploads/photo.jpg',
          path: 'checklists/photo.jpg',
          size: 100,
          mimeType: 'image/jpeg',
          filename: 'photo.jpg',
        },
      ),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });

    expect(prisma.uploadEvidence.create).not.toHaveBeenCalled();
    expect(prisma.uploadEvidence.upsert).not.toHaveBeenCalled();
  });
});

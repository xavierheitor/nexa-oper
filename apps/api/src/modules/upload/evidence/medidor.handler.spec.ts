import { AppError } from '../../../core/errors/app-error';
import { MedidorEvidenceHandler } from './medidor.handler';

describe('MedidorEvidenceHandler', () => {
  const prisma = {
    uploadEvidence: {
      create: jest.fn(),
    },
  };

  const handler = new MedidorEvidenceHandler(prisma as never);

  it('throws validation error when entityId is missing', async () => {
    await expect(
      Promise.resolve().then(() =>
        handler.validate({
          type: 'medidor',
          entityId: '',
          entityType: 'medicao',
          metadata: { turnoId: 10 },
        }),
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('throws validation error when turnoId is missing', async () => {
    await expect(
      Promise.resolve().then(() =>
        handler.validate({
          type: 'medidor',
          entityId: '31',
          entityType: 'medicao',
          metadata: {},
        }),
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('accepts payload without medidorId when turnoId exists', async () => {
    await expect(
      handler.validate({
        type: 'medidor',
        entityId: '31',
        entityType: 'medicao',
        metadata: { turnoId: 5542 },
      }),
    ).resolves.toBeUndefined();
  });
});

import { CloseTurnoUseCase } from './close-turno.use-case';
import { validateFecharTurno } from '../../turno.validation';

jest.mock('../../turno.validation', () => ({
  validateFecharTurno: jest.fn().mockResolvedValue(undefined),
}));

describe('CloseTurnoUseCase', () => {
  it('validates input, closes turno and closes turnoRealizado', async () => {
    const repo = {
      closeTurno: jest.fn().mockResolvedValue({
        id: 11,
        dataInicio: new Date('2026-01-01T10:00:00.000Z'),
        dataFim: new Date('2026-01-01T18:00:00.000Z'),
        status: 'FECHADO',
        kmInicio: 100,
        kmFim: 150,
        veiculo: { id: 1, nome: 'ABC-1234' },
        equipe: { id: 2, nome: 'Equipe A' },
      }),
    };
    const prisma = {};
    const logger = { operation: jest.fn() };
    const turnoRealizadoService = {
      fecharTurnoPorTurnoId: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new CloseTurnoUseCase(
      repo as never,
      prisma as never,
      logger as never,
      turnoRealizadoService as never,
    );

    const result = await useCase.execute({ turnoId: 11, kmFim: 150 });

    expect(result).toMatchObject({
      id: 11,
      status: 'FECHADO',
      kmFim: 150,
    });
    expect(validateFecharTurno).toHaveBeenCalledWith(
      { turnoId: 11, kmFim: 150 },
      prisma,
    );
    expect(repo.closeTurno).toHaveBeenCalledWith({ turnoId: 11, kmFim: 150 });
    expect(turnoRealizadoService.fecharTurnoPorTurnoId).toHaveBeenCalledWith(
      11,
      'system',
    );
  });
});

/**
 * Server Action para Fechar Turno
 *
 * Esta action fecha um turno existente definindo data/hora de fechamento e KM final.
 * Usa o TurnoService diretamente, sem chamar a API REST.
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import { TurnoService } from '../../services/TurnoService';
import { z } from 'zod';

const fecharTurnoSchema = z.object({
  turnoId: z.number().int().positive(),
  dataFim: z.coerce.date(),
  kmFim: z.number().int().min(0),
});

export const fecharTurno = async (rawData: unknown) =>
  handleServerAction(
    fecharTurnoSchema,
    async (data, session) => {
      const service = container.get<TurnoService>('turnoService');

      // Buscar o turno atual para preservar os outros campos
      const turnoAtual = await service.getById(data.turnoId);

      if (!turnoAtual) {
        throw new Error('Turno não encontrado');
      }

      // Verificar se o turno já está fechado
      if (turnoAtual.dataFim) {
        throw new Error('Turno já está fechado');
      }

      // Atualizar apenas dataFim e kmFim
      return service.update(
        {
          id: data.turnoId,
          dataFim: data.dataFim,
          kmFim: data.kmFim,
        },
        session.user.id
      );
    },
    rawData,
    { entityName: 'Turno', actionType: 'fechar' }
  );


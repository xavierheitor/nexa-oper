/**
 * Server Actions para EquipeTurnoHistorico
 *
 * Implementa operações para associação de equipes a horários
 */

'use server';

import { z } from 'zod';
import type { EquipeTurnoHistoricoService } from '@/lib/services/escala/EquipeTurnoHistoricoService';
import { container } from '@/lib/services/common/registerServices';
import {
  equipeTurnoHistoricoCreateSchema,
  equipeTurnoHistoricoUpdateSchema,
  equipeTurnoHistoricoFilterSchema,
} from '../../schemas/escalaSchemas';
import { handleServerAction } from '../common/actionHandler';

export const createEquipeTurnoHistorico = async (rawData: unknown) =>
  handleServerAction(
    equipeTurnoHistoricoCreateSchema,
    async (data, session) => {
      const service = container.get<EquipeTurnoHistoricoService>(
        'equipeTurnoHistoricoService'
      );
      const result = await service.create(data, session.user.id);
      // Converter Decimals para numbers
      return {
        ...result,
        duracaoHoras: Number(result.duracaoHoras),
        duracaoIntervaloHoras: Number(result.duracaoIntervaloHoras),
      };
    },
    rawData,
    { entityName: 'EquipeTurnoHistorico', actionType: 'create' }
  );

export const updateEquipeTurnoHistorico = async (rawData: unknown) =>
  handleServerAction(
    equipeTurnoHistoricoUpdateSchema,
    async (data, session) => {
      const service = container.get<EquipeTurnoHistoricoService>(
        'equipeTurnoHistoricoService'
      );
      const result = await service.update(data, session.user.id);
      // Converter Decimals para numbers
      return {
        ...result,
        duracaoHoras: Number(result.duracaoHoras),
        duracaoIntervaloHoras: Number(result.duracaoIntervaloHoras),
      };
    },
    rawData,
    { entityName: 'EquipeTurnoHistorico', actionType: 'update' }
  );

export const listEquipeTurnoHistorico = async (rawData: unknown) =>
  handleServerAction(
    equipeTurnoHistoricoFilterSchema,
    async data => {
      const service = container.get<EquipeTurnoHistoricoService>(
        'equipeTurnoHistoricoService'
      );
      const result = await service.list(data);
      // Converter Decimals para numbers
      return {
        ...result,
        data: result.data.map((item: any) => ({
          ...item,
          duracaoHoras: Number(item.duracaoHoras),
          duracaoIntervaloHoras: Number(item.duracaoIntervaloHoras),
        })),
      };
    },
    rawData,
    { entityName: 'EquipeTurnoHistorico', actionType: 'list' }
  );

export const getEquipeTurnoHistoricoById = async (id: number) =>
  handleServerAction(
    z.object({}),
    async () => {
      const service = container.get<EquipeTurnoHistoricoService>(
        'equipeTurnoHistoricoService'
      );
      const result = await service.getById(id);
      if (!result) return null;
      // Converter Decimals para numbers
      return {
        ...result,
        duracaoHoras: Number(result.duracaoHoras),
        duracaoIntervaloHoras: Number(result.duracaoIntervaloHoras),
      };
    },
    {},
    { entityName: 'EquipeTurnoHistorico', actionType: 'get' }
  );

export const deleteEquipeTurnoHistorico = async (id: number) =>
  handleServerAction(
    z.object({}),
    async (_, session) => {
      const service = container.get<EquipeTurnoHistoricoService>(
        'equipeTurnoHistoricoService'
      );
      return service.delete(id, session.user.id);
    },
    {},
    { entityName: 'EquipeTurnoHistorico', actionType: 'delete' }
  );

export const buscarHorarioVigente = async (rawData: { equipeId: number; data?: Date }) =>
  handleServerAction(
    z.object({
      equipeId: z.number().int().positive(),
      data: z.coerce.date().optional(),
    }),
    async data => {
      const service = container.get<EquipeTurnoHistoricoService>(
        'equipeTurnoHistoricoService'
      );
      const dataConsulta = data.data || new Date();
      const result = await service.buscarHorarioVigente(data.equipeId, dataConsulta);
      if (!result) return null;

      // Converter Decimals para numbers (incluindo relacionamentos)
      return {
        ...result,
        duracaoHoras: Number(result.duracaoHoras),
        duracaoIntervaloHoras: Number(result.duracaoIntervaloHoras),
        horarioAberturaCatalogo: result.horarioAberturaCatalogo
          ? {
              ...result.horarioAberturaCatalogo,
              duracaoHoras: Number(result.horarioAberturaCatalogo.duracaoHoras),
              duracaoIntervaloHoras: Number(result.horarioAberturaCatalogo.duracaoIntervaloHoras),
            }
          : null,
      };
    },
    rawData,
    { entityName: 'EquipeTurnoHistorico', actionType: 'get' }
  );


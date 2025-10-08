/**
 * Server Actions para HorarioAberturaCatalogo
 *
 * Implementa operações CRUD para catálogo de horários
 */

'use server';

import { z } from 'zod';
import type { HorarioAberturaCatalogoService } from '@/lib/services/escala/HorarioAberturaCatalogoService';
import { container } from '@/lib/services/common/registerServices';
import {
  horarioAberturaCatalogoCreateSchema,
  horarioAberturaCatalogoUpdateSchema,
  horarioAberturaCatalogoFilterSchema,
} from '../../schemas/escalaSchemas';
import { handleServerAction } from '../common/actionHandler';

export const createHorarioAberturaCatalogo = async (rawData: unknown) =>
  handleServerAction(
    horarioAberturaCatalogoCreateSchema,
    async (data, session) => {
      const service = container.get<HorarioAberturaCatalogoService>(
        'horarioAberturaCatalogoService'
      );
      const result = await service.create(data, session.user.id);
      // Converter Decimal para number
      return {
        ...result,
        duracaoHoras: Number(result.duracaoHoras),
        duracaoIntervaloHoras: Number(result.duracaoIntervaloHoras),
      };
    },
    rawData,
    { entityName: 'HorarioAberturaCatalogo', actionType: 'create' }
  );

export const updateHorarioAberturaCatalogo = async (rawData: unknown) =>
  handleServerAction(
    horarioAberturaCatalogoUpdateSchema,
    async (data, session) => {
      const service = container.get<HorarioAberturaCatalogoService>(
        'horarioAberturaCatalogoService'
      );
      const result = await service.update(data, session.user.id);
      // Converter Decimal para number
      return {
        ...result,
        duracaoHoras: Number(result.duracaoHoras),
        duracaoIntervaloHoras: Number(result.duracaoIntervaloHoras),
      };
    },
    rawData,
    { entityName: 'HorarioAberturaCatalogo', actionType: 'update' }
  );

export const listHorarioAberturaCatalogo = async (rawData: unknown) =>
  handleServerAction(
    horarioAberturaCatalogoFilterSchema,
    async data => {
      const service = container.get<HorarioAberturaCatalogoService>(
        'horarioAberturaCatalogoService'
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
    { entityName: 'HorarioAberturaCatalogo', actionType: 'list' }
  );

export const getHorarioAberturaCatalogoById = async (id: number) =>
  handleServerAction(
    z.object({}),
    async () => {
      const service = container.get<HorarioAberturaCatalogoService>(
        'horarioAberturaCatalogoService'
      );
      const result = await service.getById(id);
      if (!result) return null;
      // Converter Decimal para number
      return {
        ...result,
        duracaoHoras: Number(result.duracaoHoras),
        duracaoIntervaloHoras: Number(result.duracaoIntervaloHoras),
      };
    },
    {},
    { entityName: 'HorarioAberturaCatalogo', actionType: 'get' }
  );

export const deleteHorarioAberturaCatalogo = async (id: number) =>
  handleServerAction(
    z.object({}),
    async (_, session) => {
      const service = container.get<HorarioAberturaCatalogoService>(
        'horarioAberturaCatalogoService'
      );
      return service.delete(id, session.user.id);
    },
    {},
    { entityName: 'HorarioAberturaCatalogo', actionType: 'delete' }
  );


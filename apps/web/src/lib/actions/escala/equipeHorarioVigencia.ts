/**
 * Server Actions para EquipeHorarioVigencia
 *
 * Implementa operações CRUD para horários das equipes
 */

'use server';

import { z } from 'zod';
import type { EquipeHorarioVigenciaService } from '@/lib/services/escala/EquipeHorarioVigenciaService';
import { container } from '@/lib/services/common/registerServices';
import {
  equipeHorarioVigenciaCreateSchema,
  equipeHorarioVigenciaUpdateSchema,
  equipeHorarioVigenciaFilterSchema,
} from '../../schemas/escalaSchemas';
import { handleServerAction } from '../common/actionHandler';

/**
 * Cria novo horário de vigência para equipe
 */
export const createEquipeHorarioVigencia = async (rawData: unknown) =>
  handleServerAction(
    equipeHorarioVigenciaCreateSchema,
    async (data, session) => {
      const service = container.get<EquipeHorarioVigenciaService>(
        'equipeHorarioVigenciaService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'EquipeHorarioVigencia', actionType: 'create' }
  );

/**
 * Atualiza horário de vigência
 */
export const updateEquipeHorarioVigencia = async (rawData: unknown) =>
  handleServerAction(
    equipeHorarioVigenciaUpdateSchema,
    async (data, session) => {
      const service = container.get<EquipeHorarioVigenciaService>(
        'equipeHorarioVigenciaService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'EquipeHorarioVigencia', actionType: 'update' }
  );

/**
 * Lista horários com filtros
 */
export const listEquipeHorarioVigencia = async (rawData: unknown) =>
  handleServerAction(
    equipeHorarioVigenciaFilterSchema,
    async data => {
      const service = container.get<EquipeHorarioVigenciaService>(
        'equipeHorarioVigenciaService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'EquipeHorarioVigencia', actionType: 'list' }
  );

/**
 * Busca horário por ID
 */
export const getEquipeHorarioVigenciaById = async (id: number) =>
  handleServerAction(
    z.object({}),
    async () => {
      const service = container.get<EquipeHorarioVigenciaService>(
        'equipeHorarioVigenciaService'
      );
      return service.getById(id);
    },
    {},
    { entityName: 'EquipeHorarioVigencia', actionType: 'get' }
  );

/**
 * Exclui horário (soft delete)
 */
export const deleteEquipeHorarioVigencia = async (id: number) =>
  handleServerAction(
    z.object({}),
    async (_, session) => {
      const service = container.get<EquipeHorarioVigenciaService>(
        'equipeHorarioVigenciaService'
      );
      return service.delete(id, session.user.id);
    },
    {},
    { entityName: 'EquipeHorarioVigencia', actionType: 'delete' }
  );

/**
 * Busca horário vigente para uma equipe em uma data específica
 */
export const buscarHorarioVigente = async (equipeId: number, data: Date) =>
  handleServerAction(
    z.object({}),
    async () => {
      const service = container.get<EquipeHorarioVigenciaService>(
        'equipeHorarioVigenciaService'
      );
      return service.buscarHorarioVigente(equipeId, data);
    },
    {},
    { entityName: 'EquipeHorarioVigencia', actionType: 'get' }
  );


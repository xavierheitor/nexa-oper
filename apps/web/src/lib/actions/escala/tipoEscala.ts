/**
 * Server Actions para TipoEscala
 *
 * Implementa operações CRUD completas para tipos de escala
 */

'use server';

import { z } from 'zod';
import type { TipoEscalaService } from '@/lib/services/escala/TipoEscalaService';
import { container } from '@/lib/services/common/registerServices';
import {
  tipoEscalaCreateSchema,
  tipoEscalaUpdateSchema,
  tipoEscalaFilterSchema,
  salvarPosicoesCicloSchema,
} from '../../schemas/escalaSchemas';
import { handleServerAction } from '../common/actionHandler';

export const createTipoEscala = async (rawData: unknown) =>
  handleServerAction(
    tipoEscalaCreateSchema,
    async (data, session) => {
      const service = container.get<TipoEscalaService>('tipoEscalaService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoEscala', actionType: 'create' }
  );

export const updateTipoEscala = async (rawData: unknown) =>
  handleServerAction(
    tipoEscalaUpdateSchema,
    async (data, session) => {
      const service = container.get<TipoEscalaService>('tipoEscalaService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoEscala', actionType: 'update' }
  );

export const listTiposEscala = async (rawData: unknown) =>
  handleServerAction(
    tipoEscalaFilterSchema,
    async data => {
      const service = container.get<TipoEscalaService>('tipoEscalaService');
      return service.list(data);
    },
    rawData,
    { entityName: 'TipoEscala', actionType: 'list' }
  );

export const getTipoEscalaById = async (id: number) =>
  handleServerAction(
    z.object({}),
    async () => {
      const service = container.get<TipoEscalaService>('tipoEscalaService');
      return service.getById(id);
    },
    {},
    { entityName: 'TipoEscala', actionType: 'get' }
  );

export const deleteTipoEscala = async (id: number) =>
  handleServerAction(
    z.object({}),
    async (_, session) => {
      const service = container.get<TipoEscalaService>('tipoEscalaService');
      return service.delete(id, session.user.id);
    },
    {},
    { entityName: 'TipoEscala', actionType: 'delete' }
  );

export const salvarPosicoesCiclo = async (rawData: unknown) =>
  handleServerAction(
    salvarPosicoesCicloSchema,
    async (data, session) => {
      const service = container.get<TipoEscalaService>('tipoEscalaService');
      return service.salvarPosicoesCiclo(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoEscalaCicloPosicao', actionType: 'create' }
  );


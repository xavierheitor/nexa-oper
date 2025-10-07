/**
 * Server Actions para PapelEquipe
 *
 * Implementa operações CRUD completas para papéis de equipe
 */

'use server';

import type { PapelEquipeService } from '@/lib/services/escala/PapelEquipeService';
import { container } from '@/lib/services/common/registerServices';
import {
  papelEquipeCreateSchema,
  papelEquipeUpdateSchema,
  papelEquipeFilterSchema,
} from '../../schemas/escalaSchemas';
import { handleServerAction } from '../common/actionHandler';

/**
 * Cria novo papel de equipe
 */
export const createPapelEquipe = async (rawData: unknown) =>
  handleServerAction(
    papelEquipeCreateSchema,
    async (data, session) => {
      const service = container.get<PapelEquipeService>('papelEquipeService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'PapelEquipe', actionType: 'create' }
  );

/**
 * Atualiza papel de equipe existente
 */
export const updatePapelEquipe = async (rawData: unknown) =>
  handleServerAction(
    papelEquipeUpdateSchema,
    async (data, session) => {
      const service = container.get<PapelEquipeService>('papelEquipeService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'PapelEquipe', actionType: 'update' }
  );

/**
 * Lista papéis de equipe com filtros
 */
export const listPapeisEquipe = async (rawData: unknown) =>
  handleServerAction(
    papelEquipeFilterSchema,
    async (data) => {
      const service = container.get<PapelEquipeService>('papelEquipeService');
      return service.list(data);
    },
    rawData,
    { entityName: 'PapelEquipe', actionType: 'list' }
  );

/**
 * Busca papel de equipe por ID
 */
export const getPapelEquipeById = async (id: number) =>
  handleServerAction(
    papelEquipeFilterSchema,
    async () => {
      const service = container.get<PapelEquipeService>('papelEquipeService');
      return service.getById(id);
    },
    {},
    { entityName: 'PapelEquipe', actionType: 'get' }
  );

/**
 * Exclui papel de equipe (soft delete)
 */
export const deletePapelEquipe = async (id: number) =>
  handleServerAction(
    papelEquipeFilterSchema,
    async (_, session) => {
      const service = container.get<PapelEquipeService>('papelEquipeService');
      return service.delete(id, session.user.id);
    },
    {},
    { entityName: 'PapelEquipe', actionType: 'delete' }
  );


/**
 * Server Actions para EscalaEquipePeriodo
 *
 * Implementa operações CRUD e ações especiais para períodos de escala
 */

'use server';

import { z } from 'zod';
import type { EscalaEquipePeriodoService } from '@/lib/services/escala/EscalaEquipePeriodoService';
import { container } from '@/lib/services/common/registerServices';
import {
  escalaEquipePeriodoCreateSchema,
  escalaEquipePeriodoUpdateSchema,
  escalaEquipePeriodoFilterSchema,
  gerarSlotsSchema,
  publicarPeriodoSchema,
  arquivarPeriodoSchema,
  duplicarPeriodoSchema,
  marcarFaltaSchema,
  registrarTrocaSchema,
} from '../../schemas/escalaSchemas';
import { handleServerAction } from '../common/actionHandler';

/**
 * Cria novo período de escala
 */
export const createEscalaEquipePeriodo = async (rawData: unknown) =>
  handleServerAction(
    escalaEquipePeriodoCreateSchema,
    async (data, session) => {
      const service = container.get<EscalaEquipePeriodoService>(
        'escalaEquipePeriodoService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'EscalaEquipePeriodo', actionType: 'create' }
  );

/**
 * Atualiza período de escala
 */
export const updateEscalaEquipePeriodo = async (rawData: unknown) =>
  handleServerAction(
    escalaEquipePeriodoUpdateSchema,
    async (data, session) => {
      const service = container.get<EscalaEquipePeriodoService>(
        'escalaEquipePeriodoService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'EscalaEquipePeriodo', actionType: 'update' }
  );

/**
 * Lista períodos de escala com filtros
 */
export const listEscalasEquipePeriodo = async (rawData: unknown) =>
  handleServerAction(
    escalaEquipePeriodoFilterSchema,
    async data => {
      const service = container.get<EscalaEquipePeriodoService>(
        'escalaEquipePeriodoService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'EscalaEquipePeriodo', actionType: 'list' }
  );

/**
 * Busca período de escala por ID (com todos os relacionamentos)
 */
export const getEscalaEquipePeriodoById = async (id: number) =>
  handleServerAction(
    z.object({}),
    async () => {
      const service = container.get<EscalaEquipePeriodoService>(
        'escalaEquipePeriodoService'
      );
      return service.getById(id);
    },
    {},
    { entityName: 'EscalaEquipePeriodo', actionType: 'get' }
  );

/**
 * Exclui período de escala (soft delete)
 */
export const deleteEscalaEquipePeriodo = async (id: number) =>
  handleServerAction(
    z.object({}),
    async (_, session) => {
      const service = container.get<EscalaEquipePeriodoService>(
        'escalaEquipePeriodoService'
      );
      return service.delete(id, session.user.id);
    },
    {},
    { entityName: 'EscalaEquipePeriodo', actionType: 'delete' }
  );

/**
 * Gera slots de escala baseado no tipo configurado
 */
export const gerarSlotsEscala = async (rawData: unknown) =>
  handleServerAction(
    gerarSlotsSchema,
    async (data, session) => {
      const service = container.get<EscalaEquipePeriodoService>(
        'escalaEquipePeriodoService'
      );
      return service.gerarSlots(data, session.user.id);
    },
    rawData,
    { entityName: 'SlotEscala', actionType: 'create' }
  );

/**
 * Publica período de escala (torna imutável)
 */
export const publicarEscala = async (rawData: unknown) =>
  handleServerAction(
    publicarPeriodoSchema,
    async (data, session) => {
      const service = container.get<EscalaEquipePeriodoService>(
        'escalaEquipePeriodoService'
      );
      return service.publicar(data, session.user.id);
    },
    rawData,
    { entityName: 'EscalaEquipePeriodo', actionType: 'update' }
  );

/**
 * Arquiva período de escala
 */
export const arquivarEscala = async (rawData: unknown) =>
  handleServerAction(
    arquivarPeriodoSchema,
    async (data, session) => {
      const service = container.get<EscalaEquipePeriodoService>(
        'escalaEquipePeriodoService'
      );
      return service.arquivar(data.escalaEquipePeriodoId, session.user.id);
    },
    rawData,
    { entityName: 'EscalaEquipePeriodo', actionType: 'update' }
  );

/**
 * Duplica período de escala para novo intervalo de datas
 */
export const duplicarEscala = async (rawData: unknown) =>
  handleServerAction(
    duplicarPeriodoSchema,
    async (data, session) => {
      const service = container.get<EscalaEquipePeriodoService>(
        'escalaEquipePeriodoService'
      );
      return service.duplicar(data, session.user.id);
    },
    rawData,
    { entityName: 'EscalaEquipePeriodo', actionType: 'create' }
  );

/**
 * Marca falta de um eletricista em uma data específica
 */
export const marcarFaltaAction = async (rawData: unknown) =>
  handleServerAction(
    marcarFaltaSchema,
    async (data, session) => {
      const service = container.get<EscalaEquipePeriodoService>(
        'escalaEquipePeriodoService'
      );
      return service.marcarFalta({
        ...data,
        actorId: session.user.id,
      });
    },
    rawData,
    { entityName: 'SlotEscala', actionType: 'update' }
  );

/**
 * Registra troca de turno entre eletricistas
 */
export const registrarTrocaAction = async (rawData: unknown) =>
  handleServerAction(
    registrarTrocaSchema,
    async (data, session) => {
      const service = container.get<EscalaEquipePeriodoService>(
        'escalaEquipePeriodoService'
      );
      return service.registrarTroca({
        ...data,
        actorId: session.user.id,
      });
    },
    rawData,
    { entityName: 'EventoCobertura', actionType: 'create' }
  );

/**
 * Visualiza escala completa com todos os slots e estatísticas
 */
export const visualizarEscala = async (id: number) =>
  handleServerAction(
    z.object({ id: z.number() }),
    async (data) => {
      const service = container.get<EscalaEquipePeriodoService>(
        'escalaEquipePeriodoService'
      );
      return service.visualizar(data.id);
    },
    { id },
    { entityName: 'EscalaEquipePeriodo', actionType: 'get' }
  );


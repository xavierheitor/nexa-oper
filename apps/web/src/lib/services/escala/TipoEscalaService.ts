/**
 * Serviço para TipoEscala
 *
 * Gerencia lógica de negócio para tipos de escala
 * (4x2, 5x1, Espanhola, etc)
 */

import { TipoEscala } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  TipoEscalaCreateInput,
  TipoEscalaRepository,
  TipoEscalaUpdateInput,
} from '../../repositories/escala/TipoEscalaRepository';
import {
  tipoEscalaCreateSchema,
  tipoEscalaFilterSchema,
  tipoEscalaUpdateSchema,
} from '../../schemas/escalaSchemas';
import { PaginatedResult } from '../../types/common';

type TipoEscalaCreate = z.infer<typeof tipoEscalaCreateSchema>;
type TipoEscalaUpdate = z.infer<typeof tipoEscalaUpdateSchema>;
type TipoEscalaFilter = z.infer<typeof tipoEscalaFilterSchema>;

export class TipoEscalaService extends AbstractCrudService<
  TipoEscalaCreate,
  TipoEscalaUpdate,
  TipoEscalaFilter,
  TipoEscala
> {
  private tipoRepo: TipoEscalaRepository;

  constructor() {
    const repo = new TipoEscalaRepository();
    super(repo);
    this.tipoRepo = repo;
  }

  async create(data: TipoEscalaCreate, userId: string): Promise<TipoEscala> {
    const createData: TipoEscalaCreateInput = {
      nome: data.nome,
      modoRepeticao: data.modoRepeticao,
      cicloDias: data.cicloDias,
      periodicidadeSemanas: data.periodicidadeSemanas,
      minEletricistasPorTurno: data.minEletricistasPorTurno,
      ativo: data.ativo,
      observacoes: data.observacoes,
    };

    return this.tipoRepo.create(createData, userId);
  }

  async update(data: TipoEscalaUpdate, userId: string): Promise<TipoEscala> {
    const { id, ...updateData } = data;
    const updateInput: TipoEscalaUpdateInput = {
      id,
      ...updateData,
    };

    return this.tipoRepo.update(updateInput, userId);
  }

  async list(params: TipoEscalaFilter): Promise<PaginatedResult<TipoEscala>> {
    const { items, total } = await this.tipoRepo.list(params);
    return {
      data: items,
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}


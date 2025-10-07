/**
 * Serviço para PapelEquipe
 *
 * Gerencia lógica de negócio para papéis de equipe
 * (Líder, Motorista, Montador, etc)
 */

import { PapelEquipe } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  PapelEquipeCreateInput,
  PapelEquipeRepository,
  PapelEquipeUpdateInput,
} from '../../repositories/escala/PapelEquipeRepository';
import {
  papelEquipeCreateSchema,
  papelEquipeFilterSchema,
  papelEquipeUpdateSchema,
} from '../../schemas/escalaSchemas';
import { PaginatedResult } from '../../types/common';

type PapelEquipeCreate = z.infer<typeof papelEquipeCreateSchema>;
type PapelEquipeUpdate = z.infer<typeof papelEquipeUpdateSchema>;
type PapelEquipeFilter = z.infer<typeof papelEquipeFilterSchema>;

export class PapelEquipeService extends AbstractCrudService<
  PapelEquipeCreate,
  PapelEquipeUpdate,
  PapelEquipeFilter,
  PapelEquipe
> {
  private papelRepo: PapelEquipeRepository;

  constructor() {
    const repo = new PapelEquipeRepository();
    super(repo);
    this.papelRepo = repo;
  }

  async create(
    data: PapelEquipeCreate,
    userId: string
  ): Promise<PapelEquipe> {
    const createData: PapelEquipeCreateInput = {
      nome: data.nome,
      ativo: data.ativo,
      exigeHabilitacao: data.exigeHabilitacao,
      prioridadeEscala: data.prioridadeEscala,
    };

    return this.papelRepo.create(createData, userId);
  }

  async update(
    data: PapelEquipeUpdate,
    userId: string
  ): Promise<PapelEquipe> {
    const { id, ...updateData } = data;
    const updateInput: PapelEquipeUpdateInput = {
      id,
      ...updateData,
    };

    return this.papelRepo.update(updateInput, userId);
  }

  async list(params: PapelEquipeFilter): Promise<PaginatedResult<PapelEquipe>> {
    const { items, total } = await this.papelRepo.list(params);
    return {
      data: items,
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}


import { ProjStatusProjeto } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  ProjetoProgramacaoListItem,
  ProjetoProgramacaoRepository,
} from '../../repositories/projetos/ProjetoProgramacaoRepository';
import {
  projetoProgramacaoCreateSchema,
  projetoProgramacaoFilterSchema,
  projetoProgramacaoUpdateSchema,
} from '../../schemas/projetoProgramacaoSchema';
import type { PaginatedResult } from '../../types/common';

type ProjetoProgramacaoCreate = z.infer<typeof projetoProgramacaoCreateSchema>;
type ProjetoProgramacaoUpdate = z.infer<typeof projetoProgramacaoUpdateSchema>;
type ProjetoProgramacaoFilter = z.infer<typeof projetoProgramacaoFilterSchema>;

function buildDescricao(data: {
  numeroProjeto: string;
  equipamento: string;
  municipio: string;
}): string {
  return `${data.numeroProjeto} - ${data.equipamento} - ${data.municipio}`;
}

export class ProjetoProgramacaoService extends AbstractCrudService<
  ProjetoProgramacaoCreate,
  ProjetoProgramacaoUpdate,
  ProjetoProgramacaoFilter,
  ProjetoProgramacaoListItem,
  ProjetoProgramacaoRepository
> {
  constructor() {
    super(new ProjetoProgramacaoRepository());
  }

  async create(raw: unknown, userId: string): Promise<ProjetoProgramacaoListItem> {
    const data = projetoProgramacaoCreateSchema.parse(raw);

    return this.repo.create(
      {
        numeroProjeto: data.numeroProjeto,
        descricao: buildDescricao(data),
        status: ProjStatusProjeto.PENDENTE,
        municipio: data.municipio,
        equipamento: data.equipamento,
        observacao: data.observacao,
        createdBy: userId,
        contrato: {
          connect: {
            id: data.contratoId,
          },
        },
      },
      userId
    );
  }

  async update(raw: unknown, userId: string): Promise<ProjetoProgramacaoListItem> {
    const data = projetoProgramacaoUpdateSchema.parse(raw);

    return this.repo.update(
      data.id,
      {
        numeroProjeto: data.numeroProjeto,
        descricao: buildDescricao(data),
        municipio: data.municipio,
        equipamento: data.equipamento,
        observacao: data.observacao,
        updatedBy: userId,
        contrato: {
          connect: {
            id: data.contratoId,
          },
        },
      },
      userId
    );
  }

  async delete(id: number, userId: string): Promise<ProjetoProgramacaoListItem> {
    return this.repo.delete(id, userId);
  }

  async getById(id: number): Promise<ProjetoProgramacaoListItem | null> {
    return this.repo.findById(id);
  }

  async list(
    params: ProjetoProgramacaoFilter
  ): Promise<PaginatedResult<ProjetoProgramacaoListItem>> {
    const { items, total } = await this.repo.list(params);
    const totalPages = Math.ceil(total / params.pageSize);

    return {
      data: items,
      total,
      totalPages,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}

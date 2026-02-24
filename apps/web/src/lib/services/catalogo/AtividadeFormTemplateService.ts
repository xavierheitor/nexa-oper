import { AtividadeFormTemplate } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { AtividadeFormTemplateRepository } from '../../repositories/catalogo/AtividadeFormTemplateRepository';
import {
  atividadeFormTemplateCreateSchema,
  atividadeFormTemplateFilterSchema,
  atividadeFormTemplateUpdateSchema,
} from '../../schemas/atividadeFormTemplateSchema';

type Create = z.infer<typeof atividadeFormTemplateCreateSchema>;
type Update = z.infer<typeof atividadeFormTemplateUpdateSchema>;
type Filter = z.infer<typeof atividadeFormTemplateFilterSchema>;

export class AtividadeFormTemplateService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  AtividadeFormTemplate,
  AtividadeFormTemplateRepository
> {
  private atividadeFormTemplateRepo: AtividadeFormTemplateRepository;

  constructor() {
    const repo = new AtividadeFormTemplateRepository();
    super(repo);
    this.atividadeFormTemplateRepo = repo;
  }

  async create(data: Create, userId: string): Promise<AtividadeFormTemplate> {
    const { tipoServicoIds = [], perguntaIds = [], ...rest } = data;

    const template = await this.atividadeFormTemplateRepo.create(
      {
        nome: rest.nome,
        descricao: rest.descricao?.trim() || null,
        ativo: rest.ativo ?? true,
        createdBy: userId,
        contrato: { connect: { id: rest.contratoId } },
      },
      userId
    );

    await this.atividadeFormTemplateRepo.setTipoServicos(
      template.id,
      tipoServicoIds,
      userId
    );

    await this.atividadeFormTemplateRepo.setPerguntasFromCatalogo(
      template.id,
      rest.contratoId,
      perguntaIds,
      userId
    );

    return template;
  }

  async update(data: Update, userId: string): Promise<AtividadeFormTemplate> {
    const { id, tipoServicoIds = [], perguntaIds = [], ...rest } = data;

    const template = await this.atividadeFormTemplateRepo.update(
      id,
      {
        nome: rest.nome,
        descricao: rest.descricao?.trim() || null,
        ativo: rest.ativo ?? true,
        contrato: { connect: { id: rest.contratoId } },
      },
      userId
    );

    await this.atividadeFormTemplateRepo.setTipoServicos(id, tipoServicoIds, userId);

    await this.atividadeFormTemplateRepo.setPerguntasFromCatalogo(
      id,
      rest.contratoId,
      perguntaIds,
      userId
    );

    return template;
  }
}

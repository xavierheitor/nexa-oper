import { AtividadeFormPergunta } from '@nexa-oper/db';
import { z } from 'zod';
import { prisma } from '../../db/db.service';
import { isAtividadeCatalogTemplateName } from '../../constants/atividadeForm';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { AtividadeFormPerguntaRepository } from '../../repositories/catalogo/AtividadeFormPerguntaRepository';
import { AtividadeFormTemplateRepository } from '../../repositories/catalogo/AtividadeFormTemplateRepository';
import {
  atividadeFormPerguntaCreateSchema,
  atividadeFormPerguntaFilterSchema,
  atividadeFormPerguntaUpdateSchema,
} from '../../schemas/atividadeFormPerguntaSchema';

type Create = z.infer<typeof atividadeFormPerguntaCreateSchema>;
type Update = z.infer<typeof atividadeFormPerguntaUpdateSchema>;
type Filter = z.infer<typeof atividadeFormPerguntaFilterSchema>;

export class AtividadeFormPerguntaService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  AtividadeFormPergunta,
  AtividadeFormPerguntaRepository
> {
  private atividadeFormPerguntaRepo: AtividadeFormPerguntaRepository;
  private atividadeFormTemplateRepo: AtividadeFormTemplateRepository;

  constructor() {
    const repo = new AtividadeFormPerguntaRepository();
    super(repo);
    this.atividadeFormPerguntaRepo = repo;
    this.atividadeFormTemplateRepo = new AtividadeFormTemplateRepository();
  }

  async create(data: Create, userId: string): Promise<AtividadeFormPergunta> {
    const catalogTemplate =
      await this.atividadeFormTemplateRepo.ensurePerguntaCatalogoTemplate(
        data.contratoId,
        userId
      );

    return this.atividadeFormPerguntaRepo.create(
      {
        atividadeFormTemplate: {
          connect: { id: catalogTemplate.id },
        },
        createdBy: userId,
        perguntaChave: data.perguntaChave,
        ordem: data.ordem ?? 0,
        titulo: data.titulo,
        hintResposta: data.hintResposta?.trim() || null,
        tipoResposta: data.tipoResposta?.trim() || 'texto',
        obrigaFoto: data.obrigaFoto ?? false,
        ativo: data.ativo ?? true,
      },
      userId
    );
  }

  async update(data: Update, userId: string): Promise<AtividadeFormPergunta> {
    const { id, ...rest } = data;

    const existing = await prisma.atividadeFormPergunta.findUnique({
      where: { id },
      include: {
        atividadeFormTemplate: {
          select: { nome: true },
        },
      },
    });

    if (!existing || existing.deletedAt) {
      throw new Error('Pergunta não encontrada.');
    }

    if (!isAtividadeCatalogTemplateName(existing.atividadeFormTemplate?.nome)) {
      throw new Error('Apenas perguntas de catálogo podem ser editadas neste módulo.');
    }

    const catalogTemplate =
      await this.atividadeFormTemplateRepo.ensurePerguntaCatalogoTemplate(
        rest.contratoId,
        userId
      );

    return this.atividadeFormPerguntaRepo.update(
      id,
      {
        atividadeFormTemplate: {
          connect: { id: catalogTemplate.id },
        },
        perguntaChave: rest.perguntaChave,
        ordem: rest.ordem ?? 0,
        titulo: rest.titulo,
        hintResposta: rest.hintResposta?.trim() || null,
        tipoResposta: rest.tipoResposta?.trim() || 'texto',
        obrigaFoto: rest.obrigaFoto ?? false,
        ativo: rest.ativo ?? true,
      },
      userId
    );
  }
}

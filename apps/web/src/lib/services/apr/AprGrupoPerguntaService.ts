import { AprGrupoPergunta } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { AprGrupoPerguntaRepository } from '../../repositories/apr/AprGrupoPerguntaRepository';
import {
  aprGrupoPerguntaCreateSchema,
  aprGrupoPerguntaFilterSchema,
  aprGrupoPerguntaUpdateSchema,
} from '../../schemas/aprGrupoPerguntaSchema';

type AprGrupoPerguntaCreate = z.infer<typeof aprGrupoPerguntaCreateSchema>;
type AprGrupoPerguntaUpdate = z.infer<typeof aprGrupoPerguntaUpdateSchema>;
type AprGrupoPerguntaFilter = z.infer<typeof aprGrupoPerguntaFilterSchema>;

export class AprGrupoPerguntaService extends AbstractCrudService<
  AprGrupoPerguntaCreate,
  AprGrupoPerguntaUpdate,
  AprGrupoPerguntaFilter,
  AprGrupoPergunta
> {
  private repoConcrete: AprGrupoPerguntaRepository;

  constructor() {
    const repo = new AprGrupoPerguntaRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  async create(data: any, userId: string): Promise<AprGrupoPergunta> {
    const {
      createdBy,
      createdAt,
      perguntaIds = [],
      opcaoRespostaIds = [],
      ...grupoData
    } = data;

    const grupo = await this.repoConcrete.create(
      {
        nome: grupoData.nome,
        tipoResposta: grupoData.tipoResposta,
        ...(createdBy && { createdBy }),
        ...(createdAt && { createdAt }),
      },
      userId
    );

    await this.repoConcrete.setPerguntas(grupo.id, perguntaIds, userId);

    if (grupoData.tipoResposta === 'opcao') {
      await this.repoConcrete.setOpcoes(grupo.id, opcaoRespostaIds, userId);
    } else {
      await this.repoConcrete.setOpcoes(grupo.id, [], userId);
    }

    return grupo;
  }

  async update(data: AprGrupoPerguntaUpdate, userId: string): Promise<AprGrupoPergunta> {
    const {
      id,
      perguntaIds = [],
      opcaoRespostaIds = [],
      ...grupoData
    } = data;

    const grupo = await this.repoConcrete.update(id, grupoData, userId);

    await this.repoConcrete.setPerguntas(id, perguntaIds, userId);

    if (grupoData.tipoResposta === 'opcao') {
      await this.repoConcrete.setOpcoes(id, opcaoRespostaIds, userId);
    } else {
      await this.repoConcrete.setOpcoes(id, [], userId);
    }

    return grupo;
  }

  protected getSearchFields(): string[] {
    return ['nome', 'tipoResposta'];
  }
}

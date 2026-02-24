import { Apr } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { AprRepository } from '../../repositories/apr/AprRepository';
import { aprCreateSchema, aprFilterSchema, aprUpdateSchema } from '../../schemas/aprSchema';

type AprCreate = z.infer<typeof aprCreateSchema>;
type AprUpdate = z.infer<typeof aprUpdateSchema>;
type AprFilter = z.infer<typeof aprFilterSchema>;

export class AprService extends AbstractCrudService<
  AprCreate,
  AprUpdate,
  AprFilter,
  Apr
> {
  private repoConcrete: AprRepository;

  constructor() {
    const repo = new AprRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  async create(data: any, userId: string): Promise<Apr> {
    const {
      createdBy,
      createdAt,
      grupoPerguntaIds = [],
      ...aprData
    } = data;

    const apr = await this.repoConcrete.create(
      {
        nome: aprData.nome,
        ...(createdBy && { createdBy }),
        ...(createdAt && { createdAt }),
      },
      userId
    );

    if (grupoPerguntaIds.length > 0) {
      await this.repoConcrete.setGrupos(apr.id, grupoPerguntaIds, userId);
    }

    return apr;
  }

  async update(data: AprUpdate, userId: string): Promise<Apr> {
    const { id, grupoPerguntaIds = [], ...aprData } = data;

    const apr = await this.repoConcrete.update(id, aprData, userId);
    await this.repoConcrete.setGrupos(id, grupoPerguntaIds, userId);

    return apr;
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }
}

import { MaterialCatalogo } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { MaterialCatalogoRepository } from '../../repositories/catalogo/MaterialCatalogoRepository';
import {
  materialCatalogoCreateSchema,
  materialCatalogoFilterSchema,
  materialCatalogoUpdateSchema,
} from '../../schemas/materialCatalogoSchema';

type Create = z.infer<typeof materialCatalogoCreateSchema>;
type Update = z.infer<typeof materialCatalogoUpdateSchema>;
type Filter = z.infer<typeof materialCatalogoFilterSchema>;

export class MaterialCatalogoService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  MaterialCatalogo,
  MaterialCatalogoRepository
> {
  private materialCatalogoRepo: MaterialCatalogoRepository;

  constructor() {
    const repo = new MaterialCatalogoRepository();
    super(repo);
    this.materialCatalogoRepo = repo;
  }

  async create(data: Create, userId: string): Promise<MaterialCatalogo> {
    return this.materialCatalogoRepo.create(
      {
        codigo: data.codigo,
        descricao: data.descricao,
        unidadeMedida: data.unidadeMedida,
        ativo: data.ativo ?? true,
        contrato: { connect: { id: data.contratoId } },
        createdBy: userId,
      },
      userId
    );
  }

  async update(data: Update, userId: string): Promise<MaterialCatalogo> {
    const { id, ...rest } = data;
    return this.materialCatalogoRepo.update(
      id,
      {
        codigo: rest.codigo,
        descricao: rest.descricao,
        unidadeMedida: rest.unidadeMedida,
        ativo: rest.ativo ?? true,
        contrato: { connect: { id: rest.contratoId } },
      },
      userId
    );
  }
}

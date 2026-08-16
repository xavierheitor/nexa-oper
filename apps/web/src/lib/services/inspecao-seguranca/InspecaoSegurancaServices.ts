import {
  InspecaoSegurancaGrupoPergunta,
  InspecaoSegurancaModelo,
  InspecaoSegurancaOpcaoResposta,
  InspecaoSegurancaPergunta,
  InspecaoSegurancaTipo,
} from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  InspecaoSegurancaGrupoPerguntaRepository,
  InspecaoSegurancaModeloRepository,
  InspecaoSegurancaOpcaoRespostaRepository,
  InspecaoSegurancaPerguntaRepository,
  InspecaoSegurancaTipoRepository,
} from '../../repositories/inspecao-seguranca/InspecaoSegurancaRepositories';
import {
  inspecaoSegurancaFilterSchema,
  inspecaoSegurancaGrupoPerguntaCreateSchema,
  inspecaoSegurancaGrupoPerguntaUpdateSchema,
  inspecaoSegurancaModeloCreateSchema,
  inspecaoSegurancaModeloUpdateSchema,
  inspecaoSegurancaOpcaoRespostaCreateSchema,
  inspecaoSegurancaOpcaoRespostaUpdateSchema,
  inspecaoSegurancaPerguntaCreateSchema,
  inspecaoSegurancaPerguntaUpdateSchema,
  inspecaoSegurancaTipoCreateSchema,
  inspecaoSegurancaTipoUpdateSchema,
} from '../../schemas/inspecaoSegurancaSchema';

type Filter = z.infer<typeof inspecaoSegurancaFilterSchema>;

export class InspecaoSegurancaTipoService extends AbstractCrudService<
  z.infer<typeof inspecaoSegurancaTipoCreateSchema>,
  z.infer<typeof inspecaoSegurancaTipoUpdateSchema>,
  Filter,
  InspecaoSegurancaTipo
> {
  private repoConcrete: InspecaoSegurancaTipoRepository;

  constructor() {
    const repo = new InspecaoSegurancaTipoRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  create(data: z.infer<typeof inspecaoSegurancaTipoCreateSchema>, userId: string) {
    return this.repoConcrete.create({ ...data, createdBy: userId });
  }

  update(data: z.infer<typeof inspecaoSegurancaTipoUpdateSchema>, userId: string) {
    const { id, ...updateData } = data;
    return this.repoConcrete.update(id, updateData, userId);
  }
}

export class InspecaoSegurancaPerguntaService extends AbstractCrudService<
  z.infer<typeof inspecaoSegurancaPerguntaCreateSchema>,
  z.infer<typeof inspecaoSegurancaPerguntaUpdateSchema>,
  Filter,
  InspecaoSegurancaPergunta
> {
  private repoConcrete: InspecaoSegurancaPerguntaRepository;

  constructor() {
    const repo = new InspecaoSegurancaPerguntaRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  create(data: z.infer<typeof inspecaoSegurancaPerguntaCreateSchema>, userId: string) {
    return this.repoConcrete.create({ ...data, createdBy: userId });
  }

  update(data: z.infer<typeof inspecaoSegurancaPerguntaUpdateSchema>, userId: string) {
    const { id, ...updateData } = data;
    return this.repoConcrete.update(id, updateData, userId);
  }
}

export class InspecaoSegurancaOpcaoRespostaService extends AbstractCrudService<
  z.infer<typeof inspecaoSegurancaOpcaoRespostaCreateSchema>,
  z.infer<typeof inspecaoSegurancaOpcaoRespostaUpdateSchema>,
  Filter,
  InspecaoSegurancaOpcaoResposta
> {
  private repoConcrete: InspecaoSegurancaOpcaoRespostaRepository;

  constructor() {
    const repo = new InspecaoSegurancaOpcaoRespostaRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  create(data: z.infer<typeof inspecaoSegurancaOpcaoRespostaCreateSchema>, userId: string) {
    return this.repoConcrete.create({ ...data, createdBy: userId });
  }

  update(data: z.infer<typeof inspecaoSegurancaOpcaoRespostaUpdateSchema>, userId: string) {
    const { id, ...updateData } = data;
    return this.repoConcrete.update(id, updateData, userId);
  }
}

export class InspecaoSegurancaGrupoPerguntaService extends AbstractCrudService<
  z.infer<typeof inspecaoSegurancaGrupoPerguntaCreateSchema>,
  z.infer<typeof inspecaoSegurancaGrupoPerguntaUpdateSchema>,
  Filter,
  InspecaoSegurancaGrupoPergunta
> {
  private repoConcrete: InspecaoSegurancaGrupoPerguntaRepository;

  constructor() {
    const repo = new InspecaoSegurancaGrupoPerguntaRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  async create(
    data: z.infer<typeof inspecaoSegurancaGrupoPerguntaCreateSchema>,
    userId: string
  ) {
    const { perguntaIds, opcaoRespostaIds, ...grupoData } = data;
    const grupo = await this.repoConcrete.create({ ...grupoData, createdBy: userId });
    await this.repoConcrete.setPerguntas(grupo.id, perguntaIds, userId);
    await this.repoConcrete.setOpcoes(
      grupo.id,
      grupoData.tipoResposta === 'opcao' || grupoData.tipoResposta === 'checkbox'
        ? opcaoRespostaIds
        : [],
      userId
    );
    return grupo;
  }

  async update(
    data: z.infer<typeof inspecaoSegurancaGrupoPerguntaUpdateSchema>,
    userId: string
  ) {
    const { id, perguntaIds, opcaoRespostaIds, ...grupoData } = data;
    const grupo = await this.repoConcrete.update(id, grupoData, userId);
    await this.repoConcrete.setPerguntas(id, perguntaIds, userId);
    await this.repoConcrete.setOpcoes(
      id,
      grupoData.tipoResposta === 'opcao' || grupoData.tipoResposta === 'checkbox'
        ? opcaoRespostaIds
        : [],
      userId
    );
    return grupo;
  }
}

export class InspecaoSegurancaModeloService extends AbstractCrudService<
  z.infer<typeof inspecaoSegurancaModeloCreateSchema>,
  z.infer<typeof inspecaoSegurancaModeloUpdateSchema>,
  Filter,
  InspecaoSegurancaModelo
> {
  private repoConcrete: InspecaoSegurancaModeloRepository;

  constructor() {
    const repo = new InspecaoSegurancaModeloRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  async create(data: z.infer<typeof inspecaoSegurancaModeloCreateSchema>, userId: string) {
    const { grupoPerguntaIds, tipoId, contratoId, ...modeloData } = data;
    const modelo = await this.repoConcrete.create({
      ...modeloData,
      tipo: { connect: { id: tipoId } },
      ...(contratoId ? { contrato: { connect: { id: contratoId } } } : {}),
      createdBy: userId,
    });
    await this.repoConcrete.setGrupos(modelo.id, grupoPerguntaIds, userId);
    return modelo;
  }

  async update(data: z.infer<typeof inspecaoSegurancaModeloUpdateSchema>, userId: string) {
    const { id, grupoPerguntaIds, tipoId, contratoId, ...modeloData } = data;
    const modelo = await this.repoConcrete.update(
      id,
      {
        ...modeloData,
        tipo: { connect: { id: tipoId } },
        contrato: contratoId ? { connect: { id: contratoId } } : { disconnect: true },
      },
      userId
    );
    await this.repoConcrete.setGrupos(id, grupoPerguntaIds, userId);
    return modelo;
  }
}

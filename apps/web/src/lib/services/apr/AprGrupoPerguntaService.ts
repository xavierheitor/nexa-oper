import { AprGrupoPergunta } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { prisma } from '../../db/db.service';
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
      medidasControlePorPergunta = {},
      ...grupoData
    } = data;

    const medidasControleNormalizadas = this.normalizeMedidasControlePorPergunta(
      perguntaIds,
      medidasControlePorPergunta
    );

    await this.validateMedidasControleConfig(
      grupoData.tipoResposta,
      perguntaIds,
      opcaoRespostaIds,
      medidasControleNormalizadas
    );

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
      await this.repoConcrete.setMedidasControlePorPergunta(
        grupo.id,
        medidasControleNormalizadas,
        userId
      );
    } else {
      await this.repoConcrete.setOpcoes(grupo.id, [], userId);
      await this.repoConcrete.setMedidasControlePorPergunta(grupo.id, {}, userId);
    }

    return grupo;
  }

  async update(data: AprGrupoPerguntaUpdate, userId: string): Promise<AprGrupoPergunta> {
    const {
      id,
      perguntaIds = [],
      opcaoRespostaIds = [],
      medidasControlePorPergunta = {},
      ...grupoData
    } = data;

    const medidasControleNormalizadas = this.normalizeMedidasControlePorPergunta(
      perguntaIds,
      medidasControlePorPergunta
    );

    await this.validateMedidasControleConfig(
      grupoData.tipoResposta,
      perguntaIds,
      opcaoRespostaIds,
      medidasControleNormalizadas
    );

    const grupo = await this.repoConcrete.update(id, grupoData, userId);

    await this.repoConcrete.setPerguntas(id, perguntaIds, userId);

    if (grupoData.tipoResposta === 'opcao') {
      await this.repoConcrete.setOpcoes(id, opcaoRespostaIds, userId);
      await this.repoConcrete.setMedidasControlePorPergunta(
        id,
        medidasControleNormalizadas,
        userId
      );
    } else {
      await this.repoConcrete.setOpcoes(id, [], userId);
      await this.repoConcrete.setMedidasControlePorPergunta(id, {}, userId);
    }

    return grupo;
  }

  protected getSearchFields(): string[] {
    return ['nome', 'tipoResposta'];
  }

  private normalizeMedidasControlePorPergunta(
    perguntaIds: number[],
    medidasControlePorPergunta: Record<string, number[]>
  ): Record<string, number[]> {
    const perguntaIdsSelecionadas = new Set(perguntaIds.map(String));

    return Object.fromEntries(
      Object.entries(medidasControlePorPergunta)
        .filter(([aprPerguntaId]) => perguntaIdsSelecionadas.has(aprPerguntaId))
        .map(([aprPerguntaId, medidaIds]) => [
          aprPerguntaId,
          Array.from(new Set((medidaIds || []).filter((id) => Number.isInteger(id) && id > 0))),
        ])
        .filter(([, medidaIds]) => medidaIds.length > 0)
    );
  }

  private async validateMedidasControleConfig(
    tipoResposta: string,
    perguntaIds: number[],
    opcaoRespostaIds: number[],
    medidasControlePorPergunta: Record<string, number[]>
  ): Promise<void> {
    if (tipoResposta !== 'opcao' || opcaoRespostaIds.length === 0) {
      return;
    }

    const opcoes = await prisma.aprOpcaoResposta.findMany({
      where: {
        id: { in: opcaoRespostaIds },
        deletedAt: null,
      },
      select: {
        id: true,
        geraPendencia: true,
      },
    });

    const hasOpcaoQueGeraPendencia = opcoes.some((opcao) => opcao.geraPendencia);
    if (!hasOpcaoQueGeraPendencia) {
      return;
    }

    const perguntasSemMedidas = perguntaIds.filter(
      (perguntaId) => !medidasControlePorPergunta[String(perguntaId)]?.length
    );

    if (perguntasSemMedidas.length > 0) {
      throw new Error(
        'Configure ao menos uma medida de controle para cada pergunta do grupo quando houver opção que gera pendência.'
      );
    }

    const medidaIds = Array.from(
      new Set(Object.values(medidasControlePorPergunta).flat())
    );

    if (medidaIds.length === 0) {
      throw new Error(
        'Selecione ao menos uma medida de controle para as perguntas que podem gerar pendência.'
      );
    }

    const medidasValidas = await prisma.aprMedidaControle.findMany({
      where: {
        id: { in: medidaIds },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (medidasValidas.length !== medidaIds.length) {
      throw new Error('Uma ou mais medidas de controle selecionadas são inválidas.');
    }
  }
}

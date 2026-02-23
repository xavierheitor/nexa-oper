import type { Prisma } from '@nexa-oper/db';
import type { PrismaService } from '../../database/prisma.service';

export type SyncMode = 'snapshot' | 'delta';

export interface SyncScope {
  userId: number;
  contractIds: number[];
}

/** Models Prisma usados em sync (camelCase, como no client) */
export type SyncModelName =
  | 'atividadeFormPergunta'
  | 'atividadeFormTemplate'
  | 'atividadeFormTipoServicoRelacao'
  | 'checklist'
  | 'checklistPergunta'
  | 'checklistPerguntaRelacao'
  | 'checklistOpcaoResposta'
  | 'checklistOpcaoRespostaRelacao'
  | 'checklistTipoVeiculoRelacao'
  | 'checklistTipoEquipeRelacao'
  | 'eletricista'
  | 'equipe'
  | 'materialCatalogo'
  | 'veiculo'
  | 'tipoAtividade'
  | 'tipoAtividadeServico'
  | 'tipoEquipe'
  | 'tipoVeiculo';

/** Mapeia model → Prisma Select. Adicione aqui ao incluir novo model em sync. */
export interface SyncModelSelectMap {
  atividadeFormPergunta: Prisma.AtividadeFormPerguntaSelect;
  atividadeFormTemplate: Prisma.AtividadeFormTemplateSelect;
  atividadeFormTipoServicoRelacao: Prisma.AtividadeFormTipoServicoRelacaoSelect;
  checklist: Prisma.ChecklistSelect;
  checklistPergunta: Prisma.ChecklistPerguntaSelect;
  checklistPerguntaRelacao: Prisma.ChecklistPerguntaRelacaoSelect;
  checklistOpcaoResposta: Prisma.ChecklistOpcaoRespostaSelect;
  checklistOpcaoRespostaRelacao: Prisma.ChecklistOpcaoRespostaRelacaoSelect;
  checklistTipoVeiculoRelacao: Prisma.ChecklistTipoVeiculoRelacaoSelect;
  checklistTipoEquipeRelacao: Prisma.ChecklistTipoEquipeRelacaoSelect;
  eletricista: Prisma.EletricistaSelect;
  equipe: Prisma.EquipeSelect;
  materialCatalogo: Prisma.MaterialCatalogoSelect;
  veiculo: Prisma.VeiculoSelect;
  tipoAtividade: Prisma.TipoAtividadeSelect;
  tipoAtividadeServico: Prisma.TipoAtividadeServicoSelect;
  tipoEquipe: Prisma.TipoEquipeSelect;
  tipoVeiculo: Prisma.TipoVeiculoSelect;
}

/** Mapeia model → Prisma Include. Adicione aqui ao incluir novo model em sync. */
export interface SyncModelIncludeMap {
  atividadeFormPergunta: Prisma.AtividadeFormPerguntaInclude;
  atividadeFormTemplate: Prisma.AtividadeFormTemplateInclude;
  atividadeFormTipoServicoRelacao: Prisma.AtividadeFormTipoServicoRelacaoInclude;
  checklist: Prisma.ChecklistInclude;
  checklistPergunta: Prisma.ChecklistPerguntaInclude;
  checklistPerguntaRelacao: Prisma.ChecklistPerguntaRelacaoInclude;
  checklistOpcaoResposta: Prisma.ChecklistOpcaoRespostaInclude;
  checklistOpcaoRespostaRelacao: Prisma.ChecklistOpcaoRespostaRelacaoInclude;
  checklistTipoVeiculoRelacao: Prisma.ChecklistTipoVeiculoRelacaoInclude;
  checklistTipoEquipeRelacao: Prisma.ChecklistTipoEquipeRelacaoInclude;
  eletricista: Prisma.EletricistaInclude;
  equipe: Prisma.EquipeInclude;
  materialCatalogo: Prisma.MaterialCatalogoInclude;
  veiculo: Prisma.VeiculoInclude;
  tipoAtividade: Prisma.TipoAtividadeInclude;
  tipoAtividadeServico: Prisma.TipoAtividadeServicoInclude;
  tipoEquipe: Prisma.TipoEquipeInclude;
  tipoVeiculo: Prisma.TipoVeiculoInclude;
}

/** Definição de tabela pura (Prisma) */
export interface SyncTableDef {
  type: 'table';
  name: string;
  model: string;
  mode: SyncMode;
  select?: Record<string, unknown>;
  include?: Record<string, unknown>;
  /** Campo para filtrar por contrato; false = sem filtro (ex: checklist) */
  contractField?: string | false;
}

/** Parâmetros para defTable com tipagem forte de select/include */
export interface SyncTableDefInputTyped<M extends SyncModelName> {
  name: string;
  model: M;
  mode: SyncMode;
  /** Campos a retornar. Não use junto com include (Prisma exige um ou outro no nível raiz). */
  select?: SyncModelSelectMap[M];
  /** Relações a incluir. Não use junto com select no nível raiz. */
  include?: SyncModelIncludeMap[M];
  /** Campo para filtrar por contrato; false = sem filtro (ex: checklist) */
  contractField?: string | false;
}

/** Parâmetros para defTable (sem type) – fallback para models não mapeados */
export interface SyncTableDefInput {
  name: string;
  model: string;
  mode: SyncMode;
  select?: Record<string, unknown>;
  include?: Record<string, unknown>;
  /** Campo para filtrar por contrato; false = sem filtro (ex: checklist) */
  contractField?: string | false;
}

/** Resultado do resolver customizado */
export interface SyncCustomResolverResult {
  items: unknown[];
  deletedIds?: string[];
  nextSince?: string;
}

/** Definição customizada (joins, calculados, agregações) */
export interface SyncCustomDef {
  type: 'custom';
  name: string;
  mode: SyncMode;
  computeEtag: (prisma: PrismaService, scope: SyncScope) => Promise<string>;
  resolver: (
    prisma: PrismaService,
    scope: SyncScope,
    params: { since: string; until: Date },
  ) => Promise<SyncCustomResolverResult>;
}

/** Parâmetros para defCustom (sem type) */
export interface SyncCustomDefInput {
  name: string;
  mode: SyncMode;
  computeEtag: (prisma: PrismaService, scope: SyncScope) => Promise<string>;
  resolver: (
    prisma: PrismaService,
    scope: SyncScope,
    params: { since: string; until: Date },
  ) => Promise<SyncCustomResolverResult>;
}

export type SyncCollectionDefInput = SyncTableDef | SyncCustomDef;

/** Valida e normaliza definição de tabela pura com tipagem forte.
 * select e include são validados conforme o model (autocomplete e erro de campo inexistente).
 * Ao adicionar novo model em sync, inclua em SyncModelName, SyncModelSelectMap e SyncModelIncludeMap. */
export function defTable<M extends SyncModelName>(
  def: SyncTableDefInputTyped<M>,
): SyncTableDef {
  return {
    type: 'table',
    name: def.name,
    model: def.model,
    mode: def.mode,
    select: def.select as Record<string, unknown> | undefined,
    include: def.include as Record<string, unknown> | undefined,
    contractField:
      def.contractField !== undefined ? def.contractField : 'contratoId',
  };
}

/** Valida e normaliza definição customizada */
export function defCustom(def: SyncCustomDefInput): SyncCustomDef {
  return {
    type: 'custom',
    name: def.name,
    mode: def.mode,
    computeEtag: def.computeEtag,
    resolver: def.resolver,
  };
}

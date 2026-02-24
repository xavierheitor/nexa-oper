import { defTable } from './sync-collection.types';
import type { SyncCollectionDefInput } from './sync-collection.types';

export const SYNC_DEFINITIONS: SyncCollectionDefInput[] = [
  defTable({
    name: 'eletricista',
    model: 'eletricista',
    mode: 'delta',
    include: { cargo: { select: { id: true, nome: true } } },
  }),

  defTable({
    name: 'equipe',
    model: 'equipe',
    mode: 'delta',
  }),

  defTable({
    name: 'veiculo',
    model: 'veiculo',
    mode: 'snapshot',
    include: { tipoVeiculo: { select: { id: true, nome: true } } },
  }),

  // Catálogo de atividade (Sprint 1)
  defTable({
    name: 'atividade-tipo',
    model: 'tipoAtividade',
    mode: 'snapshot',
    select: {
      id: true,
      nome: true,
      codigo: true,
      ativo: true,
      versao: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'atividade-tipo-servico',
    model: 'tipoAtividadeServico',
    mode: 'snapshot',
    contractField: 'atividadeTipo.contratoId',
    select: {
      id: true,
      atividadeTipoId: true,
      nome: true,
      codigo: true,
      ativo: true,
      versao: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'atividade-form-template',
    model: 'atividadeFormTemplate',
    mode: 'snapshot',
    select: {
      id: true,
      nome: true,
      descricao: true,
      ativo: true,
      versaoTemplate: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'atividade-form-pergunta',
    model: 'atividadeFormPergunta',
    mode: 'snapshot',
    contractField: 'atividadeFormTemplate.contratoId',
    select: {
      id: true,
      atividadeFormTemplateId: true,
      perguntaChave: true,
      ordem: true,
      titulo: true,
      hintResposta: true,
      tipoResposta: true,
      obrigaFoto: true,
      ativo: true,
      versao: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'atividade-form-tipo-servico-relacao',
    model: 'atividadeFormTipoServicoRelacao',
    mode: 'snapshot',
    contractField: 'atividadeFormTemplate.contratoId',
    select: {
      id: true,
      atividadeFormTemplateId: true,
      atividadeTipoServicoId: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  // APR de atividade
  defTable({
    name: 'apr-modelo',
    model: 'apr',
    mode: 'snapshot',
    contractField: 'AprTipoAtividadeRelacao.some.tipoAtividade.contratoId',
    select: {
      id: true,
      nome: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'apr-tipo-atividade-relacao',
    model: 'aprTipoAtividadeRelacao',
    mode: 'snapshot',
    contractField: 'tipoAtividade.contratoId',
    select: {
      id: true,
      aprId: true,
      tipoAtividadeId: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'apr-grupo-pergunta',
    model: 'aprGrupoPergunta',
    mode: 'snapshot',
    contractField:
      'AprGrupoRelacao.some.apr.AprTipoAtividadeRelacao.some.tipoAtividade.contratoId',
    select: {
      id: true,
      nome: true,
      tipoResposta: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'apr-grupo-relacao',
    model: 'aprGrupoRelacao',
    mode: 'snapshot',
    contractField: 'apr.AprTipoAtividadeRelacao.some.tipoAtividade.contratoId',
    select: {
      id: true,
      aprId: true,
      aprGrupoPerguntaId: true,
      ordem: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'apr-pergunta',
    model: 'aprPergunta',
    mode: 'snapshot',
    contractField:
      'AprGrupoPerguntaRelacao.some.aprGrupoPergunta.AprGrupoRelacao.some.apr.AprTipoAtividadeRelacao.some.tipoAtividade.contratoId',
    select: {
      id: true,
      nome: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'apr-grupo-pergunta-relacao',
    model: 'aprGrupoPerguntaRelacao',
    mode: 'snapshot',
    contractField:
      'aprGrupoPergunta.AprGrupoRelacao.some.apr.AprTipoAtividadeRelacao.some.tipoAtividade.contratoId',
    select: {
      id: true,
      aprGrupoPerguntaId: true,
      aprPerguntaId: true,
      ordem: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'apr-opcao-resposta',
    model: 'aprOpcaoResposta',
    mode: 'snapshot',
    contractField:
      'AprGrupoOpcaoRespostaRelacao.some.aprGrupoPergunta.AprGrupoRelacao.some.apr.AprTipoAtividadeRelacao.some.tipoAtividade.contratoId',
    select: {
      id: true,
      nome: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'apr-grupo-opcao-resposta-relacao',
    model: 'aprGrupoOpcaoRespostaRelacao',
    mode: 'snapshot',
    contractField:
      'aprGrupoPergunta.AprGrupoRelacao.some.apr.AprTipoAtividadeRelacao.some.tipoAtividade.contratoId',
    select: {
      id: true,
      aprGrupoPerguntaId: true,
      aprOpcaoRespostaId: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'material-catalogo',
    model: 'materialCatalogo',
    mode: 'snapshot',
    select: {
      id: true,
      codigo: true,
      descricao: true,
      unidadeMedida: true,
      ativo: true,
      versao: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  // Tabelas auxiliares (sem filtro por contrato)
  defTable({
    name: 'tipo-equipe',
    model: 'tipoEquipe',
    mode: 'delta',
    contractField: false,
  }),

  defTable({
    name: 'tipo-veiculo',
    model: 'tipoVeiculo',
    mode: 'delta',
    contractField: false,
  }),

  // Checklist (sem filtro por contrato)
  defTable({
    name: 'checklist-modelo',
    model: 'checklist',
    mode: 'delta',
    contractField: false,
    include: { tipoChecklist: { select: { id: true, nome: true } } },
  }),

  defTable({
    name: 'checklist-pergunta',
    model: 'checklistPergunta',
    mode: 'delta',
    contractField: false,
  }),

  defTable({
    name: 'checklist-pergunta-relacao',
    model: 'checklistPerguntaRelacao',
    mode: 'delta',
    contractField: false,
  }),

  defTable({
    name: 'checklist-opcao-resposta',
    model: 'checklistOpcaoResposta',
    mode: 'delta',
    contractField: false,
    select: { id: true, nome: true, geraPendencia: true },
  }),

  defTable({
    name: 'checklist-opcao-resposta-relacao',
    model: 'checklistOpcaoRespostaRelacao',
    mode: 'delta',
    contractField: false,
  }),

  defTable({
    name: 'checklist-tipo-veiculo-relacao',
    model: 'checklistTipoVeiculoRelacao',
    mode: 'delta',
    contractField: false,
    select: { id: true, checklistId: true, tipoVeiculoId: true },
  }),

  defTable({
    name: 'checklist-tipo-equipe-relacao',
    model: 'checklistTipoEquipeRelacao',
    mode: 'delta',
    contractField: false,
    select: {
      id: true,
      checklistId: true,
      tipoEquipeId: true,
      tipoChecklistId: true,
    },
  }),
];

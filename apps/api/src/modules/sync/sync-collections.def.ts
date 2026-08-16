import {
  computeProjetosParaViabilizacaoEtag,
  listProjetosParaViabilizacao,
} from '../projetos/projeto-viabilizacao.query';

import {
  defCustom,
  defTable,
  type SyncCollectionDefInput,
} from './sync-collection.types';

export const SYNC_DEFINITIONS: SyncCollectionDefInput[] = [
  defTable({
    name: 'projeto-tipo-poste',
    model: 'projTipoPoste',
    mode: 'snapshot',
    contractField: false,
    select: {
      id: true,
      nome: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'projeto-estrutura',
    model: 'projEstrutura',
    mode: 'snapshot',
    contractField: false,
    select: {
      id: true,
      nome: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'projeto-tipo-ramal',
    model: 'projTipoRamal',
    mode: 'snapshot',
    contractField: false,
    select: {
      id: true,
      nome: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defCustom({
    name: 'projeto-viabilizacao',
    mode: 'snapshot',
    computeEtag: (prisma, scope) =>
      computeProjetosParaViabilizacaoEtag(prisma, scope.contractIds),
    resolver: async (prisma, scope) => {
      const result = await listProjetosParaViabilizacao(
        prisma,
        scope.contractIds,
      );
      return { items: result.items };
    },
  }),

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
      geraPendencia: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'apr-medida-controle',
    model: 'aprMedidaControle',
    mode: 'snapshot',
    contractField:
      'AprGrupoPerguntaMedidaControleRelacao.some.aprGrupoPergunta.AprGrupoRelacao.some.apr.AprTipoAtividadeRelacao.some.tipoAtividade.contratoId',
    select: {
      id: true,
      nome: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'apr-grupo-pergunta-medida-controle-relacao',
    model: 'aprGrupoPerguntaMedidaControleRelacao',
    mode: 'snapshot',
    contractField:
      'aprGrupoPergunta.AprGrupoRelacao.some.apr.AprTipoAtividadeRelacao.some.tipoAtividade.contratoId',
    select: {
      id: true,
      aprGrupoPerguntaId: true,
      aprPerguntaId: true,
      aprMedidaControleId: true,
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

  // Inspeções de segurança
  defTable({
    name: 'inspecao-seguranca-tipo',
    model: 'inspecaoSegurancaTipo',
    mode: 'snapshot',
    select: {
      id: true,
      contratoId: true,
      nome: true,
      chave: true,
      contexto: true,
      descricao: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'inspecao-seguranca-modelo',
    model: 'inspecaoSegurancaModelo',
    mode: 'snapshot',
    select: {
      id: true,
      contratoId: true,
      tipoId: true,
      nome: true,
      descricao: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'inspecao-seguranca-grupo-pergunta',
    model: 'inspecaoSegurancaGrupoPergunta',
    mode: 'snapshot',
    contractField: 'modelosRelacao.some.modelo.contratoId',
    select: {
      id: true,
      nome: true,
      tipoResposta: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'inspecao-seguranca-modelo-grupo-relacao',
    model: 'inspecaoSegurancaModeloGrupoRelacao',
    mode: 'snapshot',
    contractField: 'modelo.contratoId',
    select: {
      id: true,
      modeloId: true,
      grupoPerguntaId: true,
      ordem: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'inspecao-seguranca-pergunta',
    model: 'inspecaoSegurancaPergunta',
    mode: 'snapshot',
    contractField:
      'gruposRelacao.some.grupoPergunta.modelosRelacao.some.modelo.contratoId',
    select: {
      id: true,
      nome: true,
      obrigatoria: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'inspecao-seguranca-grupo-pergunta-relacao',
    model: 'inspecaoSegurancaGrupoPerguntaRelacao',
    mode: 'snapshot',
    contractField: 'grupoPergunta.modelosRelacao.some.modelo.contratoId',
    select: {
      id: true,
      grupoPerguntaId: true,
      perguntaId: true,
      ordem: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'inspecao-seguranca-opcao-resposta',
    model: 'inspecaoSegurancaOpcaoResposta',
    mode: 'snapshot',
    contractField:
      'gruposRelacao.some.grupoPergunta.modelosRelacao.some.modelo.contratoId',
    select: {
      id: true,
      nome: true,
      geraPendencia: true,
      exigeFoto: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
    },
  }),

  defTable({
    name: 'inspecao-seguranca-grupo-opcao-resposta-relacao',
    model: 'inspecaoSegurancaGrupoOpcaoRespostaRelacao',
    mode: 'snapshot',
    contractField: 'grupoPergunta.modelosRelacao.some.modelo.contratoId',
    select: {
      id: true,
      grupoPerguntaId: true,
      opcaoRespostaId: true,
      ordem: true,
      ativo: true,
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

  defTable({
    name: 'causa-improdutiva',
    model: 'causaImprodutiva',
    mode: 'snapshot',
    contractField: false,
    select: {
      id: true,
      causa: true,
      ativo: true,
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

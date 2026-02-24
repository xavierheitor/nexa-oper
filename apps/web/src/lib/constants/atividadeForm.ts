export const ATIVIDADE_FORM_CATALOGO_TEMPLATE_PREFIX =
  '__CATALOGO_PERGUNTAS_ATIVIDADE__:';

export const getAtividadeCatalogTemplateName = (contratoId: number) =>
  `${ATIVIDADE_FORM_CATALOGO_TEMPLATE_PREFIX}${contratoId}`;

export const isAtividadeCatalogTemplateName = (nome?: string | null) =>
  Boolean(nome && nome.startsWith(ATIVIDADE_FORM_CATALOGO_TEMPLATE_PREFIX));

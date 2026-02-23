// src/shared/errors/messages.ts
/**
 * Centraliza as mensagens de texto usadas em erros e retornos da API.
 * Facilita a manutenção e internacionalização futura.
 */
export const Messages = {
  vehicleNotFound: 'Veículo não encontrado',
  electricianNotFound: 'Eletricista não encontrado',
  plateDuplicate: 'Já existe um veículo com esta placa',
  unauthorized: 'Token inválido ou ausente',
  forbiddenContract: 'Sem permissão para acessar este contrato',
  invalidPayload: 'Dados inválidos fornecidos',
  internalServerError: 'Erro interno do servidor',
  notFound: 'Não encontrado',
  conflict: 'Conflito',
  forbidden: 'Proibido',
  badRequest: 'Requisição inválida',
  unprocessableEntity: 'Entidade não processável',
  tooManyRequests: 'Muitas requisições',
  internal: 'Erro interno do servidor',
  validationError: 'Erro de validação',
  turnoConflitoVeiculo: 'Já existe um turno aberto para este veículo',
  turnoConflitoEquipe: 'Já existe um turno aberto para esta equipe',
  turnoConflitoEletricista: 'Já existe um turno aberto para este eletricista',
} as const;

export type Messages = (typeof Messages)[keyof typeof Messages];

/**
 * Constantes de Erro Compartilhadas
 *
 * Centraliza mensagens de erro comuns para evitar duplicação
 * e garantir consistência na aplicação.
 */

/**
 * Mensagens de erro comuns para validação
 */
export const VALIDATION_ERRORS = {
  // Paginação
  INVALID_PAGE: 'Página deve ser um número inteiro positivo',
  INVALID_LIMIT: 'Limite deve ser um número inteiro positivo',
  PAGE_TOO_SMALL: 'Página deve ser maior que 0',
  LIMIT_TOO_SMALL: 'Limite deve ser maior que 0',
  LIMIT_TOO_LARGE: 'Limite excede o máximo permitido',

  // IDs
  INVALID_ID: 'ID deve ser um número inteiro positivo',
  INVALID_CONTRATO_ID: 'ID do contrato deve ser um número inteiro positivo',
  INVALID_TIPO_VEICULO_ID:
    'ID do tipo de veículo deve ser um número inteiro positivo',

  // Campos obrigatórios
  NOME_REQUIRED: 'Nome é obrigatório',
  MATRICULA_REQUIRED: 'Matrícula é obrigatória',
  PLACA_REQUIRED: 'Placa é obrigatória',
  MODELO_REQUIRED: 'Modelo é obrigatório',
  ANO_REQUIRED: 'Ano é obrigatório',
  CONTRATO_ID_REQUIRED: 'ID do contrato é obrigatório',

  // Tamanhos de campo
  NOME_TOO_SHORT: 'Nome deve ter pelo menos 2 caracteres',
  NOME_TOO_LONG: 'Nome deve ter no máximo 255 caracteres',
  MATRICULA_TOO_SHORT: 'Matrícula deve ter pelo menos 3 caracteres',
  MATRICULA_TOO_LONG: 'Matrícula deve ter no máximo 20 caracteres',
  PLACA_TOO_SHORT: 'Placa deve ter pelo menos 7 caracteres',
  PLACA_TOO_LONG: 'Placa deve ter no máximo 8 caracteres',
  ESTADO_INVALID_LENGTH: 'Estado deve ter exatamente 2 caracteres',

  // Formato
  TELEFONE_INVALID_FORMAT: 'Telefone deve estar no formato (XX) XXXXX-XXXX',
  PLACA_INVALID_FORMAT: 'Placa deve estar no formato ABC1234 ou ABC1D23',
  ESTADO_INVALID_FORMAT: 'Estado deve conter apenas letras maiúsculas',
} as const;

/**
 * Mensagens de erro para entidades não encontradas
 */
export const NOT_FOUND_ERRORS = {
  VEICULO_NOT_FOUND: 'Veículo não encontrado',
  ELETRICISTA_NOT_FOUND: 'Eletricista não encontrado',
  CONTRATO_NOT_FOUND: 'Contrato não encontrado',
  TIPO_VEICULO_NOT_FOUND: 'Tipo de veículo não encontrado',
  TIPO_EQUIPE_NOT_FOUND: 'Tipo de equipe não encontrado',
  EQUIPE_NOT_FOUND: 'Equipe não encontrada',
  TIPO_ATIVIDADE_NOT_FOUND: 'Tipo de atividade não encontrado',
  CHECKLIST_NOT_FOUND: 'Checklist não encontrado',
  APR_NOT_FOUND: 'Modelo APR não encontrado',
  PERGUNTA_NOT_FOUND: 'Pergunta não encontrada',
  OPCAO_RESPOSTA_NOT_FOUND: 'Opção de resposta não encontrada',
} as const;

/**
 * Mensagens de erro para conflitos
 */
export const CONFLICT_ERRORS = {
  PLACA_DUPLICATE: 'Já existe um veículo com esta placa',
  MATRICULA_DUPLICATE: 'Já existe um eletricista com esta matrícula',
  NOME_DUPLICATE: 'Já existe um registro com este nome',
  CONTRATO_DUPLICATE: 'Já existe um contrato com este número',
} as const;

/**
 * Mensagens de erro para permissões
 */
export const PERMISSION_ERRORS = {
  FORBIDDEN_CONTRACT: 'Você não tem permissão para acessar este contrato',
  FORBIDDEN_ENTITY: 'Você não tem permissão para acessar este registro',
  UNAUTHORIZED: 'Token de autenticação inválido ou ausente',
  INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes para esta operação',
} as const;

/**
 * Mensagens de erro para operações
 */
export const OPERATION_ERRORS = {
  CREATE_FAILED: 'Erro ao criar registro',
  UPDATE_FAILED: 'Erro ao atualizar registro',
  DELETE_FAILED: 'Erro ao remover registro',
  LIST_FAILED: 'Erro ao listar registros',
  COUNT_FAILED: 'Erro ao contar registros',
  SYNC_FAILED: 'Erro ao sincronizar dados',
  VALIDATION_FAILED: 'Erro de validação nos dados fornecidos',
  DATABASE_ERROR: 'Erro interno do banco de dados',
  UNKNOWN_ERROR: 'Erro interno do servidor',
} as const;

/**
 * Agregação de todas as mensagens de erro
 */
export const ERROR_MESSAGES = {
  ...VALIDATION_ERRORS,
  ...NOT_FOUND_ERRORS,
  ...CONFLICT_ERRORS,
  ...PERMISSION_ERRORS,
  ...OPERATION_ERRORS,
} as const;

/**
 * Códigos de erro padronizados
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

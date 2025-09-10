/**
 * Tipos Comuns da Aplicação
 *
 * Este arquivo centraliza todos os tipos TypeScript comuns
 * utilizados em toda a aplicação, proporcionando consistência
 * e reutilização de tipos.
 *
 * FUNCIONALIDADES:
 * - Tipos para paginação
 * - Tipos para ordenação
 * - Tipos para filtros
 * - Tipos para resultados de API
 * - Tipos para auditoria
 *
 * BENEFÍCIOS:
 * - Centralização de tipos
 * - Consistência em toda aplicação
 * - Facilita manutenção
 * - Evita duplicação
 */

// Tipos para resultados de ações
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  redirectToLogin?: boolean;
}

// Tipos para ordenação
export type OrderDir = 'asc' | 'desc';

// Tipos para includes/relacionamentos
export type IncludeConfig = Record<string, boolean | Record<string, any>>;

// Tipos para paginação
export interface PaginationParams {
  page: number;
  pageSize: number;
  orderBy: string;
  orderDir: OrderDir;
  search?: string;
  include?: IncludeConfig;
}

// Tipos para parâmetros paginados (versão flexível)
export interface PaginatedParams {
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDir?: OrderDir;
  search?: string;
  filters?: Record<string, any>;
  include?: IncludeConfig;
}

// Tipos para resultados paginados
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

// Tipos para auditoria
export interface AuditFields {
  createdBy?: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
  deletedBy?: string;
  deletedAt?: Date | null;
}

// Tipos para filtros base
export interface BaseFilter extends PaginationParams {
  // Campos comuns para todos os filtros
}

// Tipos para resultados de operações
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipos para validação
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Tipos para resultados de validação
export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: ValidationError[];
}

// Tipos para ações do servidor
export type ActionType = 'create' | 'update' | 'delete' | 'get' | 'list';

// Tipos para opções de ação
export interface ActionOptions {
  actionType?: ActionType;
  entityName?: string;
}

// Tipos para sessão do usuário
export interface UserSession {
  id: string;
  username: string;
  email?: string;
}

// Tipos para contexto de requisição
export interface RequestContext {
  user: UserSession;
  timestamp: Date;
  actionType: ActionType;
  entityName: string;
}

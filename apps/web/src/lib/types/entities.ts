/**
 * Tipos de Entidades da Aplicação
 *
 * Este arquivo centraliza tipos TypeScript para entidades principais,
 * derivados dos schemas Zod e tipos do Prisma.
 *
 * FUNCIONALIDADES:
 * - Tipos de entidades principais
 * - Tipos para operações CRUD
 * - Tipos para DTOs e responses
 *
 * BENEFÍCIOS:
 * - Centralização de tipos de entidades
 * - Consistência em toda aplicação
 * - Facilita manutenção e refatoração
 */

// Re-exportar tipos dos schemas quando disponíveis
export type {
  EletricistaCreate,
  EletricistaUpdate,
  EletricistaFilter,
  EletricistaLoteInput,
  EletricistaLoteItem,
} from '../schemas/eletricistaSchema';

export type {
  EquipeLoteInput,
  EquipeLoteItem,
} from '../schemas/equipeSchema';

// Tipos base para entidades com ID
export interface EntityWithId {
  id: number | string;
}

// Tipos base para entidades com auditoria
export interface AuditableEntity extends EntityWithId {
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

// Tipos para entidades com relacionamentos comuns
export interface BaseEntity extends AuditableEntity {
  nome: string;
  contratoId?: number;
}

// Tipos para entidades de catálogo (com ativo/inativo)
export interface CatalogoEntity extends BaseEntity {
  ativo: boolean;
  observacoes?: string | null;
}

// Tipos para entidades com status
export type EntityStatus =
  | 'ATIVO'
  | 'FERIAS'
  | 'LICENCA_MEDICA'
  | 'LICENCA_MATERNIDADE'
  | 'LICENCA_PATERNIDADE'
  | 'SUSPENSAO'
  | 'TREINAMENTO'
  | 'AFastADO'
  | 'DESLIGADO'
  | 'APOSENTADO';

export interface EntityWithStatus extends BaseEntity {
  status: EntityStatus;
}

// Tipos para entidades de relatórios
export interface ReportEntity extends EntityWithId {
  nome: string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
}

// Tipos para entidades de escala
export interface EscalaEntity extends EntityWithId {
  equipeId: number;
  tipoEscalaId: number;
  dataInicio: Date | string;
  dataFim: Date | string;
  status?: string;
}

// Tipos para entidades de turno
export interface TurnoEntity extends EntityWithId {
  veiculoId: number;
  equipeId: number;
  dataSolicitacao: Date | string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
  status?: string;
}

// Tipos para entidades de checklist
export interface ChecklistEntity extends EntityWithId {
  tipoChecklistId: number;
  turnoId?: number;
  dataRealizacao?: Date | string;
  status?: string;
}

// Tipos para entidades com relacionamento de base
export interface BaseRelatedEntity extends BaseEntity {
  baseId?: number;
}

// Tipos para entidades com relacionamento de equipe
export interface EquipeRelatedEntity extends BaseEntity {
  equipeId?: number;
  tipoEquipeId?: number;
}

// Tipos para entidades com relacionamento de veículo
export interface VeiculoRelatedEntity extends BaseEntity {
  veiculoId?: number;
  tipoVeiculoId?: number;
}

// Tipos para entidades com relacionamento de eletricista
export interface EletricistaRelatedEntity extends BaseEntity {
  eletricistaId?: number;
  cargoId?: number;
}

// Tipos para entidades de filtro genérico
export interface FilterEntity extends EntityWithId {
  nome: string;
  ativo?: boolean;
}

// Tipos para DTOs de API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedApiResponse<T = unknown> {
  success: boolean;
  data?: {
    data: T[];
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

// Tipos para entidades com contagem de relacionamentos
export interface EntityWithCounts extends EntityWithId {
  _count?: Record<string, number>;
}


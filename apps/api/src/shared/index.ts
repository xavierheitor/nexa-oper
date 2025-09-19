/**
 * Exportações do módulo Shared
 *
 * Centraliza todas as exportações de utilitários, constantes e DTOs
 * compartilhados entre diferentes módulos da aplicação.
 */

// Constantes
export * from './constants/errors';

// DTOs
export * from './dto/pagination-meta.dto';

// Utilitários
export * from './utils/audit';
export * from './utils/logger';
export * from './utils/pagination';
export * from './utils/validation';

// Interceptors
export * from './interceptors';

/**
 * Exportações do módulo CQRS de Turnos
 *
 * Centraliza todas as exportações relacionadas ao padrão CQRS
 * para facilitar imports e manter organização.
 */

// Commands
export * from './commands/create-turno.command';
export * from './commands/close-turno.command';
export * from './commands/delete-turno.command';

// Queries
export * from './queries/get-turnos.query';
export * from './queries/get-turno-by-id.query';
export * from './queries/get-turnos-for-sync.query';

// Handlers
export * from './handlers/create-turno.handler';
export * from './handlers/close-turno.handler';
export * from './handlers/delete-turno.handler';
export * from './handlers/get-turnos.handler';
export * from './handlers/get-turno-by-id.handler';
export * from './handlers/get-turnos-for-sync.handler';

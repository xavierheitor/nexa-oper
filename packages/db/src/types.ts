// Re-exportação de tipos do Prisma para facilitar importação
export type * from '../generated/prisma';

// Tipos utilitários comuns
export type DatabaseModels = {
  Test: any; // Será tipado automaticamente pelo Prisma
};

// Tipo para operações de CRUD
export type CrudOperation = 'create' | 'read' | 'update' | 'delete';

// Tipo para configuração de conexão
export interface DatabaseConfig {
  log?: boolean | string[];
  datasources?: {
    db?: {
      url?: string;
    };
  };
}

// Tipo para resultado de operações
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

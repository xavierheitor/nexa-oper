/**
 * Serviço de Banco de Dados com Singleton Pattern
 *
 * Este serviço fornece acesso direto ao Prisma Client através de um singleton,
 * eliminando a necessidade de chamar getPrisma() repetidamente.
 *
 * FUNCIONALIDADES:
 * - Singleton pattern para instância única do Prisma
 * - Acesso direto aos modelos (db.user, db.test, etc.)
 * - Gerenciamento automático de conexão/desconexão
 * - Logging integrado para desenvolvimento
 * - Health check para monitoramento
 *
 * COMO USAR:
 * ```typescript
 * // Antes (com boilerplate):
 * const users = await databaseService.getPrisma().user.findMany();
 *
 * // Agora (direto):
 * const users = await db.user.findMany();
 * ```
 *
 * BENEFÍCIOS:
 * - Menos boilerplate no código
 * - Acesso direto aos modelos
 * - Singleton garante uma única instância
 * - Mantém todos os recursos do Prisma
 */

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient, Test } from '@nexa-oper/db';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly prisma = new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  onModuleInit() {
    this.logger.log('🔄 Conectando ao banco de dados...');
    return this.prisma
      .$connect()
      .then(() => {
        this.logger.log('✅ Conectado ao banco de dados com sucesso!');
      })
      .catch((error: unknown) => {
        this.logger.error('❌ Erro ao conectar ao banco:', error);
        throw error;
      });
  }

  onModuleDestroy() {
    this.logger.log('🔄 Desconectando do banco de dados...');
    return this.prisma
      .$disconnect()
      .then(() => {
        this.logger.log('✅ Desconectado do banco de dados com sucesso!');
      })
      .catch((error: unknown) => {
        this.logger.error('❌ Erro ao desconectar do banco:', error);
      });
  }

  // Método para acessar o Prisma Client (mantido para compatibilidade)
  getPrisma(): PrismaClient {
    return this.prisma;
  }

  // Métodos de exemplo para o modelo Test (mantidos para compatibilidade)
  async findAllTests(): Promise<Test[]> {
    return await this.prisma.test.findMany();
  }
  async createTest(name: string): Promise<Test> {
    return await this.prisma.test.create({
      data: { name },
    });
  }

  async updateTest(id: number, name: string): Promise<Test> {
    return await this.prisma.test.update({
      where: { id },
      data: { name },
    });
  }

  async deleteTest(id: number): Promise<Test> {
    return await this.prisma.test.delete({
      where: { id },
    });
  }

  // Método para verificar saúde da conexão
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('❌ Health check falhou:', error);
      return false;
    }
  }
}

// Singleton instance para acesso direto
let databaseServiceInstance: DatabaseService | null = null;

/**
 * Função para obter a instância singleton do DatabaseService
 *
 * @returns Instância única do DatabaseService
 */
export function getDatabaseService(): DatabaseService {
  if (!databaseServiceInstance) {
    databaseServiceInstance = new DatabaseService();
  }
  return databaseServiceInstance;
}

/**
 * Exportação direta do Prisma Client através do singleton
 *
 * Permite acesso direto aos modelos sem boilerplate:
 * - db.user.findMany()
 * - db.test.create()
 * - db.$queryRaw()
 * - etc.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const service = getDatabaseService();
    const prisma = service.getPrisma();
    return (prisma as any)[prop];
  },
});

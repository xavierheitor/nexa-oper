/**
 * Serviço de Banco de Dados
 *
 * Este serviço gerencia a conexão com o banco de dados usando Prisma Client,
 * configurando automaticamente o timezone para GMT-3 (Brasília) e seguindo
 * os padrões de injeção de dependência do NestJS.
 *
 * FUNCIONALIDADES:
 * - Gerenciamento automático de conexão/desconexão
 * - Configuração automática de timezone (GMT-3)
 * - Logging integrado para desenvolvimento
 * - Health check para monitoramento
 * - Compatível com injeção de dependência do NestJS
 *
 * COMO USAR:
 * ```typescript
 * // Injeção de dependência (recomendado):
 * constructor(private readonly db: DatabaseService) {}
 * const users = await this.db.getPrisma().user.findMany();
 * ```
 *
 * BENEFÍCIOS:
 * - Segue padrões do NestJS
 * - Timezone configurado automaticamente
 * - Fácil de testar (mock simples)
 * - Ciclo de vida gerenciado pelo NestJS
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

  async onModuleInit() {
    this.logger.log('🔄 Conectando ao banco de dados...');
    try {
      await this.prisma.$connect();

      // Configurar timezone para GMT-3 (Horário de Brasília)
      // Isso garante que todas as operações de data/hora usem o timezone correto
      await this.prisma.$executeRaw`SET time_zone = '-03:00'`;

      // Verificar se o timezone foi configurado corretamente
      const timezoneResult = await this.prisma.$queryRaw`SELECT @@session.time_zone as timezone`;
      this.logger.log('✅ Conectado ao banco de dados com sucesso!');
      this.logger.log(`🌐 Timezone configurado: ${JSON.stringify(timezoneResult)}`);

    } catch (error: unknown) {
      this.logger.error('❌ Erro ao conectar ao banco:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔄 Desconectando do banco de dados...');
    try {
      await this.prisma.$disconnect();
      this.logger.log('✅ Desconectado do banco de dados com sucesso!');
    } catch (error: unknown) {
      this.logger.error('❌ Erro ao desconectar do banco:', error);
    }
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

/**
 * Exportação do PrismaClient para uso direto quando necessário
 *
 * ATENÇÃO: Prefira usar injeção de dependência do DatabaseService
 * em vez de importar diretamente o PrismaClient.
 *
 * @deprecated Use DatabaseService via injeção de dependência
 */
export { PrismaClient };

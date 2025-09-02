import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient, Test } from '@nexa-oper/db';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DbService.name);
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

  // Métodos para acessar o banco
  getPrisma(): PrismaClient {
    return this.prisma;
  }

  // Métodos de exemplo para o modelo Test
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

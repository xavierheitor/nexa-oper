import { PrismaClient } from '@nexa-oper/db';

declare global {
  var prisma: PrismaClient | undefined;
}

class DbService {
  private static instance: DbService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = global.prisma || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      global.prisma = this.prisma;
    }
  }

  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }
    return DbService.instance;
  }

  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Health check falhou:', error);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      if (process.env.NODE_ENV !== 'production') {
        global.prisma = undefined;
      }
      DbService.instance = undefined as any;
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    }
  }
}

export const dbService = DbService.getInstance();
export const prisma = dbService.getPrisma();

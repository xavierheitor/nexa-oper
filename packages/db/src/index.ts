import { PrismaClient } from '../generated/prisma';

// Singleton do Prisma Client
class Database {
  private static instance: Database;
  private _prisma: PrismaClient;

  private constructor() {
    this._prisma = new PrismaClient({
      log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public get prisma(): PrismaClient {
    return this._prisma;
  }

  public async disconnect(): Promise<void> {
    await this._prisma.$disconnect();
  }

  public async connect(): Promise<void> {
    await this._prisma.$connect();
  }
}

// Instância única exportada
export const db = Database.getInstance();

// Exportar o cliente Prisma diretamente
export const prisma = db.prisma;

// Exportar a classe Database para casos especiais
export { Database };

// Exportar tipos do Prisma
export type * from '../generated/prisma';

// Exportar o singleton como default
export default db;

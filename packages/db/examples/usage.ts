// Exemplos de uso do pacote @nexa-oper/db

// 1. Importação básica do Prisma Client
import { PrismaClient, Test } from '@nexa-oper/db';

export async function exampleBasicUsage() {
  const prisma = new PrismaClient();

  try {
    // Buscar todos os testes
    const testRecords = await prisma.test.findMany();

    // Criar um novo registro
    const newTest = await prisma.test.create({
      data: {
        name: 'Exemplo de Teste',
      },
    });

    return { success: true, data: { tests: testRecords, newTest } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  } finally {
    await prisma.$disconnect();
  }
}

// 2. Importação direta com configuração customizada
export async function exampleCustomPrisma() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    // Usar o cliente diretamente
    const tests = await prisma.test.findMany({
      where: {
        name: {
          contains: 'Teste',
        },
      },
    });

    return tests;
  } catch (error) {
    throw new Error(`Erro ao buscar testes: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
}

// 3. Importação de tipos
export async function exampleWithTypes(): Promise<{
  success: boolean;
  data?: Test[];
  error?: string;
  message?: string;
}> {
  const prisma = new PrismaClient();

  try {
    const tests: Test[] = await prisma.test.findMany();

    return {
      success: true,
      data: tests,
      message: `${tests.length} testes encontrados`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  } finally {
    await prisma.$disconnect();
  }
}

// 4. Exemplo de operações CRUD completas
export class TestService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(name: string): Promise<Test> {
    return await this.prisma.test.create({
      data: { name },
    });
  }

  async findById(id: number): Promise<Test | null> {
    return await this.prisma.test.findUnique({
      where: { id },
    });
  }

  async update(id: number, name: string): Promise<Test> {
    return await this.prisma.test.update({
      where: { id },
      data: { name },
    });
  }

  async delete(id: number): Promise<Test> {
    return await this.prisma.test.delete({
      where: { id },
    });
  }

  async findAll(): Promise<Test[]> {
    return await this.prisma.test.findMany();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// 5. Exemplo de uso em NestJS
export class NestJSTestService {
  private readonly prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  async findAllTests(): Promise<Test[]> {
    return await this.prisma.test.findMany();
  }

  async createTest(name: string): Promise<Test> {
    return await this.prisma.test.create({
      data: { name },
    });
  }
}

// 6. Exemplo de queries avançadas
export async function exampleAdvancedQueries() {
  const prisma = new PrismaClient();

  try {
    // Filtros
    const filtrados = await prisma.test.findMany({
      where: {
        name: { contains: 'teste' },
      },
    });

    // Paginação
    const paginados = await prisma.test.findMany({
      skip: 0,
      take: 10,
      orderBy: { name: 'asc' },
    });

    // Contagem
    const total = await prisma.test.count();

    return { filtrados, paginados, total };
  } finally {
    await prisma.$disconnect();
  }
}

// 7. Exemplo de transações
export async function exampleTransactions() {
  const prisma = new PrismaClient();

  try {
    const result = await prisma.$transaction(async tx => {
      // Criar primeiro teste
      const test1 = await tx.test.create({
        data: { name: 'Teste 1' },
      });

      // Criar segundo teste
      const test2 = await tx.test.create({
        data: { name: 'Teste 2' },
      });

      return { test1, test2 };
    });

    return result;
  } finally {
    await prisma.$disconnect();
  }
}

// 8. Exemplo de uso em API routes (Next.js)
export async function apiHandler() {
  const prisma = new PrismaClient();
  
  try {
    const tests = await prisma.test.findMany();

    return {
      status: 200,
      data: tests,
    };
  } catch (error) {
    return {
      status: 500,
      error: 'Erro interno do servidor',
    };
  } finally {
    await prisma.$disconnect();
  }
}

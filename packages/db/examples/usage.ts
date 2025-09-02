// Exemplos de uso do pacote @nexa-oper/db

// 1. Importação básica do singleton
import { db } from '@nexa-oper/db';

export async function exampleBasicUsage() {
  try {
    // Usar o singleton para operações
    const testRecords = await db.prisma.test.findMany();

    // Criar um novo registro
    const newTest = await db.prisma.test.create({
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
  }
}

// 2. Importação direta do cliente Prisma
import { prisma } from '@nexa-oper/db';

export async function exampleDirectPrisma() {
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
  }
}

// 3. Importação de tipos
import type { Test } from '@nexa-oper/db';

export async function exampleWithTypes(): Promise<{
  success: boolean;
  data?: Test[];
  error?: string;
  message?: string;
}> {
  try {
    const tests: Test[] = await db.prisma.test.findMany();

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
  }
}

// 4. Importação do cliente configurado
import { prismaClient } from '@nexa-oper/db/client';

export async function exampleCustomClient() {
  try {
    // Usar o cliente configurado
    const tests = await prismaClient.test.findMany();

    // Para casos especiais, você pode fechar a conexão
    // await closePrismaClient();

    return tests;
  } catch (error) {
    throw new Error(`Erro: ${error}`);
  }
}

// 5. Exemplo de operações CRUD completas
export class TestService {
  static async create(name: string): Promise<Test> {
    return await db.prisma.test.create({
      data: { name },
    });
  }

  static async findById(id: number): Promise<Test | null> {
    return await db.prisma.test.findUnique({
      where: { id },
    });
  }

  static async update(id: number, name: string): Promise<Test> {
    return await db.prisma.test.update({
      where: { id },
      data: { name },
    });
  }

  static async delete(id: number): Promise<Test> {
    return await db.prisma.test.delete({
      where: { id },
    });
  }

  static async findAll(): Promise<Test[]> {
    return await db.prisma.test.findMany();
  }
}

// 6. Exemplo de uso em uma API route (Next.js)
export async function apiHandler() {
  try {
    const tests = await TestService.findAll();

    return {
      status: 200,
      data: tests,
    };
  } catch (error) {
    return {
      status: 500,
      error: 'Erro interno do servidor',
    };
  }
}

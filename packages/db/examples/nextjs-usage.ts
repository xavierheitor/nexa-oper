// Exemplo de uso do pacote @nexa-oper/db em aplicações Next.js

import { PrismaClient, Test } from '@nexa-oper/db';

// 1. API Route Handler
export async function GET() {
  const prisma = new PrismaClient();

  try {
    const tests = await prisma.test.findMany();

    return Response.json({
      success: true,
      data: tests,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  const prisma = new PrismaClient();

  try {
    const { name } = await request.json();

    if (!name) {
      return Response.json(
        {
          success: false,
          error: 'Nome é obrigatório',
        },
        { status: 400 }
      );
    }

    const newTest = await prisma.test.create({
      data: { name },
    });

    return Response.json(
      {
        success: true,
        data: newTest,
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 2. Server Action (Next.js 14+)
export async function createTestAction(formData: FormData) {
  'use server';

  const prisma = new PrismaClient();

  try {
    const name = formData.get('name') as string;

    if (!name) {
      throw new Error('Nome é obrigatório');
    }

    const test = await prisma.test.create({
      data: { name },
    });

    return { success: true, data: test };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  } finally {
    await prisma.$disconnect();
  }
}

// 3. Função utilitária para componentes
export async function getTests(): Promise<Test[]> {
  const prisma = new PrismaClient();

  try {
    return await prisma.test.findMany({
      orderBy: { id: 'desc' },
    });
  } catch (error) {
    console.error('Erro ao buscar testes:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

// 4. Hook personalizado (para uso em componentes)
export function useTests() {
  // Em um hook real, você usaria useState e useEffect
  // Este é apenas um exemplo da estrutura
  return {
    getTests,
    createTest: createTestAction,
  };
}

// 5. Cliente Prisma compartilhado para múltiplas operações
class PrismaService {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
      });
    }
    return PrismaService.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
      PrismaService.instance = null;
    }
  }
}

// 6. Funções usando o serviço compartilhado
export async function getTestsWithSharedClient(): Promise<Test[]> {
  const prisma = PrismaService.getInstance();

  try {
    return await prisma.test.findMany({
      orderBy: { id: 'desc' },
    });
  } catch (error) {
    console.error('Erro ao buscar testes:', error);
    return [];
  }
}

export async function createTestWithSharedClient(name: string): Promise<Test> {
  const prisma = PrismaService.getInstance();

  return await prisma.test.create({
    data: { name },
  });
}

// 7. Middleware para fechar conexões
export async function closeDatabaseConnection() {
  try {
    await PrismaService.disconnect();
  } catch (error) {
    console.error('Erro ao fechar conexão:', error);
  }
}



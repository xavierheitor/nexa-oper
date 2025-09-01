// Exemplo de uso do pacote @nexa-oper/db em aplicações Next.js

import { db } from '@nexa-oper/db';
import type { Test } from '@nexa-oper/db';

// 1. API Route Handler
export async function GET() {
  try {
    const tests = await db.prisma.test.findMany();

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
  }
}

export async function POST(request: Request) {
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

    const newTest = await db.prisma.test.create({
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
  }
}

// 2. Server Action (Next.js 14+)
export async function createTestAction(formData: FormData) {
  'use server';

  try {
    const name = formData.get('name') as string;

    if (!name) {
      throw new Error('Nome é obrigatório');
    }

    const test = await db.prisma.test.create({
      data: { name },
    });

    return { success: true, data: test };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// 3. Função utilitária para componentes
export async function getTests(): Promise<Test[]> {
  try {
    return await db.prisma.test.findMany({
      orderBy: { id: 'desc' },
    });
  } catch (error) {
    console.error('Erro ao buscar testes:', error);
    return [];
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

// 5. Configuração para middleware (se necessário)
export async function closeDatabaseConnection() {
  try {
    await db.disconnect();
  } catch (error) {
    console.error('Erro ao fechar conexão:', error);
  }
}

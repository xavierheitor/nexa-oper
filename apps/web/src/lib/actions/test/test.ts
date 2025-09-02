'use server';

import { prisma } from '../../db/db.service';

export async function getTests() {
  try {
    const tests = await prisma.test.findMany();
    return tests;
  } catch (error) {
    console.error('Erro ao buscar testes:', error);
    throw new Error(`Falha na conexão com o banco: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function createTest(name: string) {
  try {
    const test = await prisma.test.create({
      data: { name },
    });
    return test;
  } catch (error) {
    console.error('Erro ao criar teste:', error);
    throw new Error(`Falha ao criar teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function getTestById(id: number) {
  try {
    const test = await prisma.test.findUnique({
      where: { id },
    });
    return test;
  } catch (error) {
    console.error('Erro ao buscar teste por ID:', error);
    throw new Error(`Falha ao buscar teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function updateTest(id: number, name: string) {
  try {
    const test = await prisma.test.update({
      where: { id },
      data: { name },
    });
    return test;
  } catch (error) {
    console.error('Erro ao atualizar teste:', error);
    throw new Error(`Falha ao atualizar teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function deleteTest(id: number) {
  try {
    const test = await prisma.test.delete({
      where: { id },
    });
    return test;
  } catch (error) {
    console.error('Erro ao deletar teste:', error);
    throw new Error(`Falha ao deletar teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Erro no health check:', error);
    return false;
  }
}

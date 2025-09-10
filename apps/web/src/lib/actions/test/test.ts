/**
 * Server Actions para Testes de Conectividade e Desenvolvimento
 *
 * Este arquivo contém actions de teste utilizadas para verificar
 * a conectividade com o banco de dados e realizar testes durante
 * o desenvolvimento da aplicação.
 *
 * FUNCIONALIDADES:
 * - CRUD completo para entidade Test
 * - Health check do banco de dados
 * - Testes de conectividade
 * - Validação da infraestrutura
 *
 * USO RECOMENDADO:
 * - Desenvolvimento e debugging
 * - Testes de conectividade
 * - Validação de deploy
 * - Monitoramento básico
 *
 * COMO USAR:
 * ```typescript
 * // Health check
 * const isHealthy = await healthCheck();
 * console.log('DB Status:', isHealthy ? 'OK' : 'Error');
 *
 * // CRUD de teste
 * const test = await createTest('Meu Teste');
 * const tests = await getTests();
 * const updated = await updateTest(test.id, 'Teste Atualizado');
 * await deleteTest(test.id);
 * ```
 */

'use server';

import { prisma } from '../../db/db.service';

/**
 * Lista todos os testes cadastrados
 *
 * @returns Array com todos os registros de teste
 * @throws Error se houver falha na conexão com o banco
 */
export async function getTests() {
  try {
    const tests = await prisma.test.findMany();
    return tests;
  } catch (error) {
    console.error('Erro ao buscar testes:', error);
    throw new Error(
      `Falha na conexão com o banco: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Cria um novo registro de teste
 *
 * @param name - Nome do teste a ser criado
 * @returns Registro de teste criado
 * @throws Error se houver falha ao criar o teste
 */
export async function createTest(name: string) {
  try {
    const test = await prisma.test.create({
      data: { name },
    });
    return test;
  } catch (error) {
    console.error('Erro ao criar teste:', error);
    throw new Error(
      `Falha ao criar teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Busca um teste específico por ID
 *
 * @param id - ID do teste a ser buscado
 * @returns Registro de teste encontrado ou null
 * @throws Error se houver falha na busca
 */
export async function getTestById(id: number) {
  try {
    const test = await prisma.test.findUnique({
      where: { id },
    });
    return test;
  } catch (error) {
    console.error('Erro ao buscar teste por ID:', error);
    throw new Error(
      `Falha ao buscar teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Atualiza um teste existente
 *
 * @param id - ID do teste a ser atualizado
 * @param name - Novo nome para o teste
 * @returns Registro de teste atualizado
 * @throws Error se houver falha na atualização
 */
export async function updateTest(id: number, name: string) {
  try {
    const test = await prisma.test.update({
      where: { id },
      data: { name },
    });
    return test;
  } catch (error) {
    console.error('Erro ao atualizar teste:', error);
    throw new Error(
      `Falha ao atualizar teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Remove um teste do banco de dados (hard delete)
 *
 * @param id - ID do teste a ser removido
 * @returns Registro de teste removido
 * @throws Error se houver falha na remoção
 */
export async function deleteTest(id: number) {
  try {
    const test = await prisma.test.delete({
      where: { id },
    });
    return test;
  } catch (error) {
    console.error('Erro ao deletar teste:', error);
    throw new Error(
      `Falha ao deletar teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Verifica a conectividade com o banco de dados
 *
 * Executa uma query simples para validar se a conexão
 * com o banco está funcionando corretamente.
 *
 * @returns true se a conexão está OK, false caso contrário
 */
export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Erro no health check:', error);
    return false;
  }
}

/**
 * Helper para Construção de OrderBy do Prisma
 *
 * Este módulo fornece utilitários para construir objetos de ordenação
 * válidos para o Prisma Client, com suporte a múltiplos campos e
 * direções de ordenação flexíveis.
 *
 * FUNCIONALIDADES:
 * - Suporte a ordenação por campo único ou múltiplos campos
 * - Direção de ordenação configurável (asc/desc)
 * - Tratamento seguro de valores undefined/null
 * - Formato de saída compatível com Prisma Client
 * - Type safety completo com TypeScript
 *
 * COMO FUNCIONA:
 * 1. Recebe campo(s) de ordenação e direção
 * 2. Normaliza entrada para array de campos
 * 3. Mapeia cada campo para objeto de ordenação
 * 4. Retorna array compatível com Prisma
 *
 * BENEFÍCIOS:
 * - Simplifica construção de orderBy complexos
 * - Evita erros de sintaxe do Prisma
 * - Reutilização em múltiplas queries
 * - Código mais limpo e legível
 * - Suporte a ordenação múltipla
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Ordenação simples
 * const orderBy = buildPrismaOrderBy('name');
 * // Resultado: [{ name: 'asc' }]
 *
 * // Ordenação múltipla
 * const orderBy = buildPrismaOrderBy(['name', 'email'], 'desc');
 * // Resultado: [{ name: 'desc' }, { email: 'desc' }]
 *
 * // Uso em query Prisma
 * const users = await prisma.user.findMany({
 *   orderBy: buildPrismaOrderBy(['name', 'createdAt'], 'asc')
 * });
 * ```
 */

// Tipo para direção de ordenação
export type OrderDir = 'asc' | 'desc';

/**
 * Constrói um objeto orderBy válido para o Prisma Client
 *
 * Esta função converte campos de ordenação em formato string ou array
 * para o formato de objeto esperado pelo Prisma Client, permitindo
 * ordenação por um ou múltiplos campos com direção configurável.
 *
 * @param orderBy - Campo(s) para ordenação (string única ou array de strings)
 * @param orderDir - Direção da ordenação ('asc' ou 'desc'), padrão: 'asc'
 * @returns Array de objetos de ordenação compatível com Prisma ou undefined
 *
 * EXEMPLOS:
 * ```typescript
 * // Campo único
 * buildPrismaOrderBy('name')
 * // Retorna: [{ name: 'asc' }]
 *
 * // Múltiplos campos
 * buildPrismaOrderBy(['name', 'email'])
 * // Retorna: [{ name: 'asc' }, { email: 'asc' }]
 *
 * // Com direção personalizada
 * buildPrismaOrderBy('createdAt', 'desc')
 * // Retorna: [{ createdAt: 'desc' }]
 *
 * // Entrada vazia
 * buildPrismaOrderBy()
 * // Retorna: undefined
 * ```
 */
export function buildPrismaOrderBy(
  orderBy?: string | string[], // Campo(s) para ordenação
  orderDir: OrderDir = 'asc' // Direção da ordenação (padrão: asc)
) {
  // Se não há campo de ordenação, retorna undefined
  // Isso permite que o Prisma use a ordenação padrão
  if (!orderBy) {
    return undefined;
  }

  // Normaliza entrada para array de campos
  // Se receber string única, converte para array com um elemento
  // Se receber array, mantém como está
  const fields = Array.isArray(orderBy) ? orderBy : [orderBy];

  // Mapeia cada campo para objeto de ordenação no formato do Prisma
  // Cada campo vira um objeto: { campo: direção }
  return fields.map(field => ({
    [field]: orderDir, // Usa computed property name para criar o objeto
  }));
}

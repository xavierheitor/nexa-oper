/**
 * Constantes para limites de estatísticas e relatórios
 *
 * Define limites máximos para queries de estatísticas para evitar
 * problemas de performance e garantir que os dados possam ser carregados
 * de forma eficiente.
 */

/**
 * Limite máximo de itens para estatísticas
 *
 * Este limite é usado em queries de estatísticas que precisam
 * carregar todos os tipos de equipe, bases, etc. para fazer agregações.
 *
 * Se o número real de itens exceder este limite, os resultados podem
 * estar incompletos. Neste caso, considere aumentar o limite ou
 * implementar paginação.
 */
export const MAX_STATS_ITEMS = 500;

/**
 * Limite padrão para queries de estatísticas
 *
 * Limite usado na maioria das queries de estatísticas.
 * Deve ser suficiente para a maioria dos casos de uso.
 */
export const DEFAULT_STATS_PAGE_SIZE = 100;


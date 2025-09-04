/**
 * Server Action para Listagem de Contratos
 *
 * Esta action implementa a listagem paginada de contratos através
 * de Server Actions do Next.js, incluindo filtros, ordenação,
 * paginação e busca textual.
 *
 * FUNCIONALIDADES:
 * - Listagem paginada de contratos
 * - Filtros de busca por nome e número
 * - Ordenação configurável por qualquer campo
 * - Paginação com controle de tamanho de página
 * - Contagem total de registros
 * - Autenticação obrigatória
 * - Logging automático da operação
 *
 * COMO FUNCIONA:
 * 1. Valida parâmetros de filtro, paginação e ordenação
 * 2. Verifica autenticação do usuário
 * 3. Aplica filtros de busca nos campos nome e número
 * 4. Executa ordenação conforme solicitado
 * 5. Retorna resultados paginados com metadados
 * 6. Registra a operação nos logs
 *
 * PARÂMETROS ACEITOS:
 * - page: Página atual (padrão: 1)
 * - pageSize: Itens por página (padrão: 10, máximo: 100)
 * - orderBy: Campo de ordenação (padrão: 'id')
 * - orderDir: Direção da ordenação ('asc' ou 'desc', padrão: 'asc')
 * - search: Termo de busca (opcional)
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Listagem básica
 * const result = await listContratos({
 *   page: 1,
 *   pageSize: 10
 * });
 *
 * // Listagem com filtros
 * const result = await listContratos({
 *   page: 1,
 *   pageSize: 20,
 *   search: 'contrato teste',
 *   orderBy: 'nome',
 *   orderDir: 'asc'
 * });
 *
 * if (result.success) {
 *   console.log('Contratos:', result.data.data);
 *   console.log('Total:', result.data.total);
 *   console.log('Páginas:', result.data.totalPages);
 * }
 *
 * // Uso em componente React
 * const [contratos, setContratos] = useState([]);
 * const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
 *
 * const loadContratos = async () => {
 *   const result = await listContratos(pagination);
 *   if (result.success) {
 *     setContratos(result.data.data);
 *   }
 * };
 * ```
 */

'use server';

import { contratoFilterSchema } from '@/lib/schemas/contratoSchema';
import type { ContratoService } from '@/lib/services/ContratoService';
import { container } from '@/lib/services/common/registerServices';
import { handleServerAction } from '../common/actionHandler';

/**
 * Lista contratos com paginação e filtros
 *
 * @param rawParams - Parâmetros brutos de filtro e paginação
 * @returns Resultado paginado com contratos, total e metadados
 */
export const listContratos = (rawParams: unknown) =>
  handleServerAction(
    contratoFilterSchema,
    async params => {
      // Obtém o serviço do container
      const service = container.get<ContratoService>('contratoService');

      // Lista contratos com os parâmetros fornecidos
      return service.list(params);
    },
    rawParams,
    { entityName: 'Contrato', actionType: 'list' }
  );

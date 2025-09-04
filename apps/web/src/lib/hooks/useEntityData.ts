/**
 * Hook para Gerenciamento de Dados de Entidades com Paginação
 *
 * Este hook fornece uma abstração completa para gerenciar dados de entidades
 * com suporte a paginação, ordenação, filtros e integração com tabelas do
 * Ant Design, utilizando SWR para cache e sincronização de dados.
 *
 * FUNCIONALIDADES:
 * - Paginação automática com controle de estado
 * - Ordenação por qualquer campo
 * - Filtros dinâmicos e busca textual
 * - Cache inteligente com SWR
 * - Integração nativa com Ant Design Table
 * - Suporte a modo simples (sem paginação)
 * - Mutação e revalidação de dados
 * - Type safety completo
 * - Logging detalhado para debugging
 *
 * COMO FUNCIONA:
 * 1. Recebe fetcher e configurações iniciais
 * 2. Gerencia estado de parâmetros (página, tamanho, ordenação)
 * 3. Integra com SWR para cache e sincronização
 * 4. Normaliza dados (array simples ou paginado)
 * 5. Fornece handlers para tabelas Ant Design
 * 6. Retorna dados, estado e controles
 *
 * BENEFÍCIOS:
 * - Reduz boilerplate em 80% para listagens
 * - Cache automático e inteligente
 * - Sincronização em tempo real
 * - Integração perfeita com Ant Design
 * - Debugging facilitado com logs
 * - Type safety garantido
 * - Reutilização em múltiplas entidades
 * - Performance otimizada
 *
 * MODOS DE OPERAÇÃO:
 * - Paginado: Controle completo de paginação
 * - Simples: Lista todos os dados sem paginação
 *
 * EXEMPLO DE USO PAGINADO:
 * ```typescript
 * // Hook para listagem de contratos com paginação
 * const {
 *   data: contratos,
 *   total,
 *   params,
 *   setParams,
 *   isLoading,
 *   pagination,
 *   handleTableChange,
 *   mutate
 * } = useEntityData({
 *   key: 'contratos',
 *   fetcher: (params) => listContratos(params),
 *   initialParams: { pageSize: 20, orderBy: 'nome' },
 *   paginationEnabled: true
 * });
 *
 * // Uso em tabela Ant Design
 * <Table
 *   dataSource={contratos}
 *   loading={isLoading}
 *   pagination={pagination}
 *   onChange={handleTableChange}
 *   columns={columns}
 * />
 * ```
 *
 * EXEMPLO DE USO SIMPLES:
 * ```typescript
 * // Hook para lista simples (dropdown, select)
 * const {
 *   data: contratos,
 *   isLoading,
 *   mutate
 * } = useEntityData({
 *   key: 'contratos-all',
 *   fetcher: () => listAllContratos(),
 *   paginationEnabled: false
 * });
 *
 * // Uso em select
 * <Select loading={isLoading}>
 *   {contratos.map(contrato => (
 *     <Option key={contrato.id} value={contrato.id}>
 *       {contrato.nome}
 *     </Option>
 *   ))}
 * </Select>
 * ```
 *
 * EXEMPLO COM FILTROS CUSTOMIZADOS:
 * ```typescript
 * const {
 *   data,
 *   params,
 *   setParams,
 *   isLoading
 * } = useEntityData({
 *   key: 'contratos-filtered',
 *   fetcher: listContratos,
 *   initialParams: {
 *     pageSize: 50,
 *     orderBy: 'dataInicio',
 *     orderDir: 'desc'
 *   },
 *   paginationEnabled: true
 * });
 *
 * // Aplicar filtro customizado
 * const handleFilter = (search: string) => {
 *   setParams(prev => ({ ...prev, search, page: 1 }));
 * };
 *
 * // Refresh manual
 * const handleRefresh = () => {
 *   mutate();
 * };
 * ```
 */

'use client';

import { TableProps } from 'antd';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { PaginatedParams, PaginatedResult } from '../types/common';

/**
 * Tipo de retorno para modo paginado
 *
 * Inclui todos os dados, controles de paginação e handlers
 * para integração completa com tabelas Ant Design.
 */
type UseEntityDataPaginated<T> = {
  /** Array de dados da página atual */
  data: T[];
  /** Total de registros no servidor */
  total: number;
  /** Total de páginas calculado */
  totalPages: number;
  /** Parâmetros atuais de paginação/filtros */
  params: PaginatedParams;
  /** Função para atualizar parâmetros */
  setParams: React.Dispatch<React.SetStateAction<PaginatedParams>>;
  /** Estado de carregamento */
  isLoading: boolean;
  /** Erro se houver */
  error: unknown;
  /** Função para revalidar dados */
  mutate: () => void;
  /** Chave usada pelo SWR */
  mutateKey: [string, PaginatedParams];
  /** Configuração de paginação para Ant Design Table */
  pagination: TableProps<T>['pagination'];
  /** Handler de mudança de tabela (paginação, ordenação, filtros) */
  handleTableChange: TableProps<T>['onChange'];
};

/**
 * Tipo de retorno para modo simples
 *
 * Versão simplificada sem controles de paginação,
 * ideal para dropdowns, selects e listas simples.
 */
type UseEntityDataSimple<T> = {
  /** Array completo de dados */
  data: T[];
  /** Estado de carregamento */
  isLoading: boolean;
  /** Erro se houver */
  error: unknown;
  /** Função para revalidar dados */
  mutate: () => void;
  /** Chave usada pelo SWR */
  mutateKey: string;
};

/**
 * Overload para modo paginado
 *
 * Quando paginationEnabled é true, retorna interface completa
 * com controles de paginação e integração com Ant Design Table.
 */
export function useEntityData<T>(options: {
  key: string;
  fetcher: (params?: PaginatedParams) => Promise<PaginatedResult<T> | T[]>;
  initialParams?: Partial<PaginatedParams>;
  paginationEnabled: true;
}): UseEntityDataPaginated<T>;

/**
 * Overload para modo simples
 *
 * Quando paginationEnabled é false ou omitido, retorna interface
 * simplificada ideal para dropdowns e listas simples.
 */
export function useEntityData<T>(options: {
  key: string;
  fetcher: (params?: PaginatedParams) => Promise<PaginatedResult<T> | T[]>;
  initialParams?: Partial<PaginatedParams>;
  paginationEnabled?: false;
}): UseEntityDataSimple<T>;

/**
 * Implementação principal do hook useEntityData
 *
 * Este hook gerencia dados de entidades com suporte a paginação,
 * ordenação, filtros e cache inteligente usando SWR.
 *
 * @template T - Tipo da entidade gerenciada
 * @param options - Configurações do hook
 * @param options.key - Chave única para cache SWR
 * @param options.fetcher - Função que busca os dados
 * @param options.initialParams - Parâmetros iniciais de paginação
 * @param options.paginationEnabled - Se deve usar modo paginado
 * @returns Interface apropriada baseada no modo selecionado
 */
export function useEntityData<T>(options: {
  key: string;
  fetcher: (params?: PaginatedParams) => Promise<PaginatedResult<T> | T[]>;
  initialParams?: Partial<PaginatedParams>;
  paginationEnabled?: boolean;
}): any {
  // Extrai configurações com valores padrão
  const {
    key,
    fetcher,
    initialParams = {},
    paginationEnabled = false,
  } = options;

  // Estado de parâmetros de paginação/filtros
  const [params, setParams] = useState<PaginatedParams>({
    page: 1,
    pageSize: 10,
    orderDir: 'asc',
    orderBy: 'id',
    ...initialParams,
  });

  // Log para debugging - mostra quando parâmetros mudam
  useEffect(() => {
    console.log(
      `[useEntityData] 🧪 Parâmetros atualizados para ${key}:`,
      params
    );
  }, [params, key]);

  // Chave do SWR - inclui params apenas se paginação estiver habilitada
  const swrKey = paginationEnabled ? [key, params] : key;

  // Integração com SWR para cache e sincronização
  const { data, error, isLoading, mutate } = useSWR(swrKey, () =>
    fetcher(paginationEnabled ? params : undefined)
  );

  // Normaliza dados - funciona com array simples ou resultado paginado
  const result = Array.isArray(data)
    ? { data, total: data.length, totalPages: 1 }
    : {
        data: data?.data ?? [],
        total: data?.total ?? 0,
        totalPages: data?.totalPages ?? 0,
      };

  // Log para debugging - mostra dados carregados
  useEffect(() => {
    if (data) {
      const logResult = Array.isArray(data)
        ? { data, total: data.length, totalPages: 1 }
        : {
            data: data?.data ?? [],
            total: data?.total ?? 0,
            totalPages: data?.totalPages ?? 0,
          };
      console.log(`[useEntityData] 📦 Dados carregados para ${key}:`, logResult);
    }
  }, [data, key]);

  /**
   * Handler para mudanças na tabela Ant Design
   *
   * Processa mudanças de paginação, ordenação e filtros
   * vindas da tabela e atualiza o estado interno.
   */
  const handleTableChange: TableProps<T>['onChange'] = (
    pagination,
    filters,
    sorter
  ) => {
    const field = !Array.isArray(sorter) && sorter?.field;
    const order = !Array.isArray(sorter) && sorter?.order;

    // Log para debugging
    console.log(
      `[useEntityData] 🎯 Filtros recebidos do AntD (${key}):`,
      filters
    );
    console.log(`[useEntityData] 🎯 Ordenação recebida:`, field, order);

    // Atualiza parâmetros com novos valores da tabela
    setParams((prev: PaginatedParams) => ({
      ...prev,
      page: pagination?.current || 1,
      pageSize: pagination?.pageSize || 10,
      orderBy: typeof field === 'string' ? field : prev.orderBy,
      orderDir: order === 'descend' ? 'desc' : 'asc',
      filters: filters,
    }));
  };

  // Retorno para modo paginado
  if (paginationEnabled) {
    return {
      data: result.data,
      total: result.total,
      totalPages: result.totalPages,
      params,
      setParams,
      isLoading,
      error,
      mutate,
      mutateKey: swrKey,
      pagination: {
        current: params.page,
        pageSize: params.pageSize,
        total: result.total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} de ${total} itens`,
      } as TableProps<T>['pagination'],
      handleTableChange,
    };
  }

  // Retorno para modo simples
  return {
    data: result.data,
    isLoading,
    error,
    mutate,
    mutateKey: swrKey,
  };
}

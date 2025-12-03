/**
 * Hook para Paginação Client-Side de Tabelas
 *
 * Hook reutilizável para gerenciar estado de paginação em tabelas do Ant Design
 * quando os dados já estão carregados no cliente (client-side pagination).
 *
 * FUNCIONALIDADES:
 * - Gerencia estado de página atual e tamanho da página
 * - Fornece configuração pronta para Ant Design Table
 * - Reset automático para primeira página ao mudar tamanho
 * - Opções customizáveis de tamanho de página
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const { pagination } = useTablePagination({ defaultPageSize: 10 });
 *
 * <Table
 *   dataSource={dados}
 *   pagination={pagination}
 *   columns={columns}
 * />
 * ```
 *
 * EXEMPLO COM OPÇÕES CUSTOMIZADAS:
 * ```typescript
 * const { pagination } = useTablePagination({
 *   defaultPageSize: 20,
 *   pageSizeOptions: ['10', '20', '50', '100', '200'],
 *   showTotal: (total) => `Total: ${total} registros`,
 * });
 * ```
 */

'use client';

import { TableProps } from 'antd';
import { useState, useMemo } from 'react';

interface UseTablePaginationOptions {
  /** Tamanho padrão da página */
  defaultPageSize?: number;
  /** Opções de tamanho de página disponíveis */
  pageSizeOptions?: string[];
  /** Função customizada para exibir total */
  showTotal?: (total: number, range: [number, number]) => string;
  /** Se deve mostrar o seletor de tamanho */
  showSizeChanger?: boolean;
  /** Se deve mostrar o jumper rápido */
  showQuickJumper?: boolean;
}

interface UseTablePaginationReturn {
  /** Estado atual da paginação */
  paginationState: {
    current: number;
    pageSize: number;
  };
  /** Configuração de paginação para Ant Design Table */
  pagination: TableProps<any>['pagination'];
  /** Função para resetar para primeira página */
  resetToFirstPage: () => void;
}

/**
 * Hook para gerenciar paginação client-side de tabelas
 *
 * @param options - Opções de configuração da paginação
 * @returns Objeto com estado e configuração de paginação
 */
export function useTablePagination(
  options: UseTablePaginationOptions = {}
): UseTablePaginationReturn {
  const {
    defaultPageSize = 10,
    pageSizeOptions = ['10', '20', '50', '100'],
    showTotal,
    showSizeChanger = true,
    showQuickJumper = false,
  } = options;

  // Estado da paginação
  const [paginationState, setPaginationState] = useState({
    current: 1,
    pageSize: defaultPageSize,
  });

  // Função para resetar para primeira página
  const resetToFirstPage = () => {
    setPaginationState((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  // Configuração de paginação para Ant Design Table
  const pagination: TableProps<any>['pagination'] = useMemo(
    () => ({
      current: paginationState.current,
      pageSize: paginationState.pageSize,
      showSizeChanger,
      showQuickJumper,
      pageSizeOptions,
      showTotal,
      onChange: (page: number, size?: number) => {
        setPaginationState({
          current: page,
          pageSize: size || paginationState.pageSize,
        });
      },
      onShowSizeChange: (_current: number, size: number) => {
        setPaginationState({
          current: 1, // Resetar para primeira página ao mudar o tamanho
          pageSize: size,
        });
      },
    }),
    [paginationState, showSizeChanger, showQuickJumper, pageSizeOptions, showTotal]
  );

  return {
    paginationState,
    pagination,
    resetToFirstPage,
  };
}


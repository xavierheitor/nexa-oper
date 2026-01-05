'use client';

import { getApr } from '@/lib/actions/apr/get';
import { deleteApr } from '@/lib/actions/apr/delete';
import { getTextFilter } from '@/ui/components/tableFilters';
import { Apr } from '@nexa-oper/db';
import type { CrudController } from '@/lib/hooks/useCrudController';
import { Button, Card, Table, Tag } from 'antd';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { TableProps } from 'antd';
import type { PaginatedParams } from '@/lib/types/common';

// Tipo helper baseado na estrutura real do useEntityData com paginação habilitada
type UseEntityDataPaginated<T> = {
  data: T[];
  isLoading: boolean;
  error: unknown;
  mutate: () => void;
  pagination: TableProps<T>['pagination'];
  handleTableChange: TableProps<T>['onChange'];
};

interface AprTableProps {
  aprs: UseEntityDataPaginated<Apr>;
  controller: CrudController<Apr>;
}

/**
 * Componente de tabela para listagem de APRs
 *
 * Exibe lista paginada de APRs com colunas para:
 * - ID, Nome, Quantidade de Perguntas, Quantidade de Opções de Resposta, Data de criação
 * - Ações de editar e excluir por linha
 */
export function AprTable({ aprs, controller }: AprTableProps) {
  // Configuração das colunas da tabela com ações automáticas
  const columns = useTableColumnsWithActions<Apr>(
    [
      // Coluna ID
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        width: 80
      },

      // Coluna principal: Nome da APR
      {
        title: 'Nome da APR',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<Apr>('nome', 'APR'),
      },

      // Coluna: Quantidade de Perguntas vinculadas
      {
        title: 'Perguntas',
        key: 'perguntas',
        width: 100,
        align: 'center' as const,
        render: (_, record: Apr & { AprPerguntaRelacao?: unknown[] }) => {
          const count = record.AprPerguntaRelacao?.length || 0;
          return (
            <Tag color={count > 0 ? 'blue' : 'default'}>
              {count}
            </Tag>
          );
        },
        sorter: (a: Apr & { AprPerguntaRelacao?: unknown[] }, b: Apr & { AprPerguntaRelacao?: unknown[] }) => {
          const countA = a.AprPerguntaRelacao?.length || 0;
          const countB = b.AprPerguntaRelacao?.length || 0;
          return countA - countB;
        },
      },

      // Coluna: Quantidade de Opções de Resposta vinculadas
      {
        title: 'Opções de Resposta',
        key: 'opcoes',
        width: 140,
        align: 'center' as const,
        render: (_, record: Apr & { AprOpcaoRespostaRelacao?: unknown[] }) => {
          const count = record.AprOpcaoRespostaRelacao?.length || 0;
          return (
            <Tag color={count > 0 ? 'green' : 'default'}>
              {count}
            </Tag>
          );
        },
        sorter: (a: Apr & { AprOpcaoRespostaRelacao?: unknown[] }, b: Apr & { AprOpcaoRespostaRelacao?: unknown[] }) => {
          const countA = a.AprOpcaoRespostaRelacao?.length || 0;
          const countB = b.AprOpcaoRespostaRelacao?.length || 0;
          return countA - countB;
        },
      },

      // Coluna de data de criação
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (date: Date) => new Date(date).toLocaleDateString('pt-BR'),
        width: 120,
      },
    ],
    {
      // Ação de edição: carrega dados e abre modal
      onEdit: async (item) => {
        const result = await getApr({ id: item.id });
        if (result.success && result.data) {
          controller.open(result.data);
        }
      },

      // Ação de exclusão: confirma e executa soft delete
      onDelete: (item) =>
        controller
          .exec(
            () => deleteApr({ id: item.id }),
            'APR excluída com sucesso!'
          )
          .finally(() => aprs.mutate()),
    }
  );

  return (
    <Card
      title="APRs (Análise Preliminar de Risco)"
      extra={
        <Button
          type="primary"
          onClick={() => controller.open()}
        >
          Adicionar APR
        </Button>
      }
    >
      <Table<Apr>
        columns={columns}
        dataSource={aprs.data}
        loading={aprs.isLoading}
        rowKey="id"
        pagination={aprs.pagination}
        onChange={aprs.handleTableChange}
        scroll={{ x: 800 }}
      />
    </Card>
  );
}


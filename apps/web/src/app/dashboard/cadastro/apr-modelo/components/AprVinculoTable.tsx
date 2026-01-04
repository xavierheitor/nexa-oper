'use client';

import { deleteAprTipoAtividadeVinculo } from '@/lib/actions/aprVinculo/tipoAtividade/delete';
import { AprTipoAtividadeRelacao } from '@nexa-oper/db';
import type { CrudController } from '@/lib/hooks/useCrudController';
import { Button, Card, Table } from 'antd';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
// Tipo helper baseado na estrutura real do useEntityData com paginação habilitada
type UseEntityDataPaginated<T> = {
  data: T[];
  isLoading: boolean;
  error: unknown;
  mutate: () => void;
  pagination: any;
  handleTableChange: any;
};

interface AprVinculoTableProps {
  vinculos: UseEntityDataPaginated<AprTipoAtividadeRelacao>;
  controller: CrudController<AprTipoAtividadeRelacao>;
}

/**
 * Componente de tabela para listagem de vínculos APR-TipoAtividade
 *
 * Exibe lista paginada de vínculos com colunas para:
 * - ID, Tipo de Atividade, APR Vinculada, Data de vinculação
 * - Ação de excluir por linha
 */
export function AprVinculoTable({ vinculos, controller }: AprVinculoTableProps) {
  // Configuração das colunas da tabela de vínculos APR-TipoAtividade
  const columns = useTableColumnsWithActions<AprTipoAtividadeRelacao>(
    [
      // Coluna ID
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        width: 80
      },

      // Coluna: Tipo de Atividade
      {
        title: 'Tipo de Atividade',
        dataIndex: ['tipoAtividade', 'nome'],
        key: 'tipoAtividade',
        sorter: true,
      },

      // Coluna: APR vinculada
      {
        title: 'APR Vinculada',
        dataIndex: ['apr', 'nome'],
        key: 'apr',
        sorter: true,
      },

      // Coluna de data de criação
      {
        title: 'Vinculado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (date: Date) => new Date(date).toLocaleDateString('pt-BR'),
        width: 120,
      },
    ],
    {
      // Ação de exclusão: confirma e remove vínculo
      onDelete: (item) =>
        controller
          .exec(
            () => deleteAprTipoAtividadeVinculo({ id: item.id }),
            'Vínculo removido com sucesso!'
          )
          .finally(() => vinculos.mutate()),
    }
  );

  return (
    <Card
      title="Vínculos APR - Tipo de Atividade"
      style={{ marginTop: 16 }}
      extra={
        <Button
          type="primary"
          onClick={() => controller.open()}
        >
          Adicionar Vínculo
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={vinculos.data}
        loading={vinculos.isLoading}
        rowKey="id"
        pagination={vinculos.pagination}
        onChange={vinculos.handleTableChange}
        scroll={{ x: 600 }}
      />
    </Card>
  );
}


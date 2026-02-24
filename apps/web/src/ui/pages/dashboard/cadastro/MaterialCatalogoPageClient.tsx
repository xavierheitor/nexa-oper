'use client';

import { createMaterialCatalogo } from '@/lib/actions/materialCatalogo/create';
import { deleteMaterialCatalogo } from '@/lib/actions/materialCatalogo/delete';
import { listMateriaisCatalogo } from '@/lib/actions/materialCatalogo/list';
import { updateMaterialCatalogo } from '@/lib/actions/materialCatalogo/update';
import { listContratos } from '@/lib/actions/contrato/list';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { ActionResult, PaginatedResult } from '@/lib/types/common';
import TableExternalFilters from '@/ui/components/TableExternalFilters';
import { getTextFilter } from '@/ui/components/tableFilters';
import MaterialCatalogoForm, {
  MaterialCatalogoFormData,
} from '@/ui/pages/dashboard/cadastro/material-catalogo/form';
import MaterialCatalogoLoteForm from '@/ui/pages/dashboard/cadastro/material-catalogo/lote-form';
import { Contrato, MaterialCatalogo } from '@nexa-oper/db';
import { Button, Card, Modal, Space, Table, Tag } from 'antd';
import { useState } from 'react';

type MaterialCatalogoWithContrato = MaterialCatalogo & {
  contrato?: Pick<Contrato, 'id' | 'nome' | 'numero'> | null;
};

interface MaterialCatalogoPageClientProps {
  initialMateriais?: PaginatedResult<MaterialCatalogoWithContrato>;
  initialContratos?: Contrato[];
}

export default function MaterialCatalogoPageClient({
  initialMateriais,
  initialContratos = [],
}: MaterialCatalogoPageClientProps) {
  const controller = useCrudController<MaterialCatalogoWithContrato>(
    'materiais-catalogo'
  );
  const [isLoteModalOpen, setIsLoteModalOpen] = useState(false);

  const materiais = useEntityData<MaterialCatalogoWithContrato>({
    key: 'materiais-catalogo',
    fetcherAction: unwrapPaginatedFetcher(listMateriaisCatalogo),
    paginationEnabled: true,
    initialData: initialMateriais,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: { contrato: true },
    },
  });

  const contratos = useEntityData<Contrato>({
    key: 'contratos-material-catalogo',
    fetcherAction: unwrapFetcher(listContratos),
    paginationEnabled: false,
    initialData: initialContratos,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const columns = useTableColumnsWithActions<MaterialCatalogoWithContrato>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Código',
        dataIndex: 'codigo',
        key: 'codigo',
        sorter: true,
        ...getTextFilter<MaterialCatalogoWithContrato>('codigo', 'código'),
      },
      {
        title: 'Descrição',
        dataIndex: 'descricao',
        key: 'descricao',
        sorter: true,
        ...getTextFilter<MaterialCatalogoWithContrato>('descricao', 'descrição'),
      },
      {
        title: 'Unidade',
        dataIndex: 'unidadeMedida',
        key: 'unidadeMedida',
        width: 140,
      },
      {
        title: 'Contrato',
        dataIndex: ['contrato', 'nome'],
        key: 'contrato',
        width: 220,
        render: (_nome: string, record: MaterialCatalogoWithContrato) => {
          if (!record.contrato) {
            return '-';
          }

          return record.contrato.numero
            ? `${record.contrato.nome} (${record.contrato.numero})`
            : record.contrato.nome;
        },
      },
      {
        title: 'Ativo',
        dataIndex: 'ativo',
        key: 'ativo',
        width: 100,
        render: (ativo: boolean) =>
          ativo ? <Tag color='green'>Sim</Tag> : <Tag color='red'>Não</Tag>,
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (date: Date | string) => new Date(date).toLocaleDateString('pt-BR'),
        width: 120,
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteMaterialCatalogo({ id: item.id }),
            'Material excluído com sucesso!'
          )
          .finally(() => materiais.mutate()),
    }
  );

  const handleSubmit = async (values: MaterialCatalogoFormData) => {
    const action = async (): Promise<ActionResult<MaterialCatalogo>> => {
      const payload = {
        ...values,
        contratoId: Number(values.contratoId),
      };

      if (controller.editingItem?.id) {
        return updateMaterialCatalogo({
          ...payload,
          id: controller.editingItem.id,
        });
      }

      return createMaterialCatalogo(payload);
    };

    controller.exec(action, 'Material salvo com sucesso!').finally(() => {
      materiais.mutate();
    });
  };

  if (materiais.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar materiais.</p>;
  }

  return (
    <>
      <Card
        title='Materiais'
        extra={
          <Space>
            <Button onClick={() => setIsLoteModalOpen(true)}>Cadastro em Lote</Button>
            <Button type='primary' onClick={() => controller.open()}>
              Adicionar
            </Button>
          </Space>
        }
      >
        <TableExternalFilters
          filters={[
            {
              label: 'Contrato',
              placeholder: 'Filtrar por contrato',
              options:
                contratos.data?.map((contrato) => ({
                  label: contrato.numero
                    ? `${contrato.nome} (${contrato.numero})`
                    : contrato.nome,
                  value: contrato.id,
                })) || [],
              onChange: (contratoId) =>
                materiais.setParams((prev) => ({ ...prev, contratoId, page: 1 })),
              loading: contratos.isLoading,
            },
          ]}
        />

        <Table<MaterialCatalogoWithContrato>
          columns={columns}
          dataSource={materiais.data}
          loading={materiais.isLoading}
          rowKey='id'
          pagination={materiais.pagination}
          onChange={materiais.handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Material' : 'Novo Material'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={720}
      >
        <MaterialCatalogoForm
          initialValues={
            controller.editingItem
              ? {
                  codigo: controller.editingItem.codigo,
                  descricao: controller.editingItem.descricao,
                  unidadeMedida: controller.editingItem.unidadeMedida,
                  contratoId: controller.editingItem.contratoId,
                  ativo: controller.editingItem.ativo,
                }
              : { ativo: true }
          }
          contratos={contratos.data || []}
          onSubmit={handleSubmit}
          loading={controller.loading}
        />
      </Modal>

      <Modal
        title='Cadastro de Materiais em Lote'
        open={isLoteModalOpen}
        onCancel={() => setIsLoteModalOpen(false)}
        footer={null}
        width={1100}
        destroyOnHidden
      >
        <MaterialCatalogoLoteForm
          contratos={contratos.data || []}
          onSuccess={() => {
            setIsLoteModalOpen(false);
            materiais.mutate();
          }}
        />
      </Modal>
    </>
  );
}

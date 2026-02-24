'use client';

import { Tag } from 'antd';
import { createTipoJustificativa } from '@/lib/actions/tipo-justificativa/create';
import { updateTipoJustificativa } from '@/lib/actions/tipo-justificativa/update';
import { deleteTipoJustificativa } from '@/lib/actions/tipo-justificativa/delete';
import { listTiposJustificativa } from '@/lib/actions/tipo-justificativa/list';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { TipoJustificativa } from '@nexa-oper/db';
import TipoJustificativaForm from '@/ui/pages/dashboard/cadastro/tipo-justificativa/form';

interface TipoJustificativaPageClientProps {
  initialData?: PaginatedResult<TipoJustificativa>;
}

export default function TipoJustificativaPageClient({
  initialData,
}: TipoJustificativaPageClientProps) {
  const controller = useCrudController<TipoJustificativa>('tipos-justificativa');

  const tipos = useEntityData<TipoJustificativa>({
    key: 'tipos-justificativa',
    fetcherAction: unwrapFetcher(listTiposJustificativa),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createTipoJustificativa,
    updateAction: updateTipoJustificativa,
    onSuccess: () => tipos.mutate(),
    successMessage: 'Tipo de justificativa salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<TipoJustificativa>(
    [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        width: 80,
      },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<TipoJustificativa>('nome', 'nome do tipo'),
      },
      {
        title: 'Descricao',
        dataIndex: 'descricao',
        key: 'descricao',
        render: (descricao: string | null) => descricao || '-',
      },
      {
        title: 'Gera Falta',
        dataIndex: 'geraFalta',
        key: 'geraFalta',
        render: (geraFalta: boolean) => (
          <Tag color={geraFalta ? 'red' : 'green'}>
            {geraFalta ? 'Sim' : 'Nao'}
          </Tag>
        ),
      },
      {
        title: 'Ativo',
        dataIndex: 'ativo',
        key: 'ativo',
        render: (ativo: boolean) => (
          <Tag color={ativo ? 'success' : 'default'}>
            {ativo ? 'Ativo' : 'Inativo'}
          </Tag>
        ),
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
            () => deleteTipoJustificativa({ id: item.id }),
            'Tipo de justificativa excluido com sucesso!'
          )
          .finally(() => tipos.mutate()),
    }
  );

  return (
    <CrudPage
      title='Tipos de Justificativa'
      entityKey='tipos-justificativa'
      controller={controller}
      entityData={tipos}
      columns={columns}
      formComponent={TipoJustificativaForm}
      onSubmit={handleSubmit}
      addButtonText='Novo Tipo'
    />
  );
}

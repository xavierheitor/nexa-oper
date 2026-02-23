'use client';

import { createTipoAtividade } from '@/lib/actions/tipoAtividade/create';
import { deleteTipoAtividade } from '@/lib/actions/tipoAtividade/delete';
import { listTiposAtividade } from '@/lib/actions/tipoAtividade/list';
import { updateTipoAtividade } from '@/lib/actions/tipoAtividade/update';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import CrudPage from '@/lib/components/CrudPage';
import { getTextFilter } from '@/ui/components/tableFilters';
import { TipoAtividade } from '@nexa-oper/db';
import TipoAtividadeForm from './form';

export default function TipoAtividadePage() {
  const controller = useCrudController<TipoAtividade>('tipos-atividade');

  const tipos = useEntityData<TipoAtividade>({
    key: 'tipos-atividade',
    fetcherAction: unwrapFetcher(listTiposAtividade),
    paginationEnabled: true,
    initialParams: { page: 1, pageSize: 10, orderBy: 'id', orderDir: 'desc' },
  });

  // Handler padronizado para forms CRUD
  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createTipoAtividade,
    updateAction: updateTipoAtividade,
    onSuccess: () => tipos.mutate(),
    successMessage: 'Tipo salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<TipoAtividade>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      { title: 'Nome', dataIndex: 'nome', key: 'nome', sorter: true, ...getTextFilter<TipoAtividade>('nome', 'nome') },
      { title: 'Criado em', dataIndex: 'createdAt', key: 'createdAt', sorter: true, render: (d: Date | string) => new Date(d).toLocaleDateString('pt-BR'), width: 120 },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) => controller.exec(() => deleteTipoAtividade({ id: item.id }), 'Tipo excluído com sucesso!').finally(() => tipos.mutate()),
    }
  );

  return (
    <CrudPage
      title="Tipos de Atividade"
      entityKey="tipos-atividade"
      controller={controller}
      entityData={tipos}
      columns={columns}
      formComponent={TipoAtividadeForm}
      onSubmit={handleSubmit}
    />
  );
}


'use client';

import { createAprOpcaoResposta } from '@/lib/actions/aprOpcaoResposta/create';
import { deleteAprOpcaoResposta } from '@/lib/actions/aprOpcaoResposta/delete';
import { listAprOpcoesResposta } from '@/lib/actions/aprOpcaoResposta/list';
import { updateAprOpcaoResposta } from '@/lib/actions/aprOpcaoResposta/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { getTextFilter } from '@/ui/components/tableFilters';
import { AprOpcaoResposta } from '@nexa-oper/db';
import { Spin } from 'antd';
import AprOpcaoRespostaForm from './form';

export default function AprOpcaoRespostaPage() {
  const controller = useCrudController<AprOpcaoResposta>('apr-opcoes-resposta');

  const opcoesResposta = useEntityData<AprOpcaoResposta>({
    key: 'apr-opcoes-resposta',
    fetcherAction: unwrapFetcher(listAprOpcoesResposta),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  });

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createAprOpcaoResposta,
    updateAction: updateAprOpcaoResposta,
    onSuccess: () => opcoesResposta.mutate(),
    successMessage: 'Opção de resposta salva com sucesso!',
  });

  const columns = useTableColumnsWithActions<AprOpcaoResposta>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<AprOpcaoResposta>('nome', 'nome da opção'),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(() => deleteAprOpcaoResposta({ id: item.id }), 'Opção de resposta excluída com sucesso!')
          .finally(() => opcoesResposta.mutate()),
    }
  );

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <CrudPage
      title="Opções de Resposta APR"
      entityKey="apr-opcoes-resposta"
      controller={controller}
      entityData={opcoesResposta}
      columns={columns}
      formComponent={AprOpcaoRespostaForm}
      onSubmit={handleSubmit}
      modalWidth={600}
    />
  );
}

'use client';

import { createInspecaoSegurancaOpcaoResposta } from '@/lib/actions/inspecaoSegurancaOpcaoResposta/create';
import { deleteInspecaoSegurancaOpcaoResposta } from '@/lib/actions/inspecaoSegurancaOpcaoResposta/delete';
import { listInspecaoSegurancaOpcoesResposta } from '@/lib/actions/inspecaoSegurancaOpcaoResposta/list';
import { updateInspecaoSegurancaOpcaoResposta } from '@/lib/actions/inspecaoSegurancaOpcaoResposta/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import type { InspecaoSegurancaOpcaoResposta } from '@nexa-oper/db';
import InspecaoSegurancaOpcaoRespostaForm, { InspecaoSegurancaOpcaoRespostaFormData } from './inspecao-seguranca-opcao-resposta/form';

export default function InspecaoSegurancaOpcaoRespostaPageClient({
  initialData,
}: {
  initialData?: PaginatedResult<InspecaoSegurancaOpcaoResposta>;
}) {
  const controller = useCrudController<InspecaoSegurancaOpcaoResposta>('inspecao-seguranca-opcoes');
  const opcoes = useEntityData<InspecaoSegurancaOpcaoResposta>({
    key: 'inspecao-seguranca-opcoes',
    fetcherAction: unwrapFetcher(listInspecaoSegurancaOpcoesResposta),
    paginationEnabled: true,
    initialData,
    initialParams: { page: 1, pageSize: 10, orderBy: 'id', orderDir: 'desc' },
  });
  const handleSubmit = useCrudFormHandler<InspecaoSegurancaOpcaoRespostaFormData, InspecaoSegurancaOpcaoResposta>({
    controller,
    createAction: createInspecaoSegurancaOpcaoResposta,
    updateAction: updateInspecaoSegurancaOpcaoResposta,
    onSuccess: () => opcoes.mutate(),
    successMessage: 'Opção salva com sucesso!',
  });
  const columns = useTableColumnsWithActions<InspecaoSegurancaOpcaoResposta>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      { title: 'Opção', dataIndex: 'nome', key: 'nome', sorter: true, ...getTextFilter<InspecaoSegurancaOpcaoResposta>('nome', 'opção') },
      { title: 'Gera Pendência', dataIndex: 'geraPendencia', key: 'geraPendencia', render: (v: boolean) => (v ? 'Sim' : 'Não'), width: 150 },
      { title: 'Exige Foto', dataIndex: 'exigeFoto', key: 'exigeFoto', render: (v: boolean) => (v ? 'Sim' : 'Não'), width: 120 },
    ],
    {
      onEdit: controller.open,
      onDelete: item => controller.exec(() => deleteInspecaoSegurancaOpcaoResposta({ id: item.id }), 'Opção excluída com sucesso!').finally(() => opcoes.mutate()),
    }
  );
  return <CrudPage<InspecaoSegurancaOpcaoResposta, InspecaoSegurancaOpcaoRespostaFormData> title='Opções de Inspeção' entityKey='inspecao-seguranca-opcoes' controller={controller} entityData={opcoes} columns={columns} formComponent={InspecaoSegurancaOpcaoRespostaForm} onSubmit={handleSubmit} modalWidth={700} />;
}

'use client';

import { createAprGrupoPergunta } from '@/lib/actions/aprGrupoPergunta/create';
import { deleteAprGrupoPergunta } from '@/lib/actions/aprGrupoPergunta/delete';
import { listAprGruposPergunta } from '@/lib/actions/aprGrupoPergunta/list';
import { updateAprGrupoPergunta } from '@/lib/actions/aprGrupoPergunta/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { AprGrupoPergunta } from '@nexa-oper/db';
import { Tag } from 'antd';
import AprGrupoPerguntaForm from '@/ui/pages/dashboard/cadastro/apr-grupo-pergunta/form';

interface AprGrupoPerguntaPageClientProps {
  initialData?: PaginatedResult<AprGrupoPergunta>;
}

export default function AprGrupoPerguntaPageClient({
  initialData,
}: AprGrupoPerguntaPageClientProps) {
  const controller = useCrudController<AprGrupoPergunta>('apr-grupos-pergunta');

  const grupos = useEntityData<AprGrupoPergunta>({
    key: 'apr-grupos-pergunta',
    fetcherAction: unwrapFetcher(listAprGruposPergunta),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        AprGrupoPerguntaRelacao: true,
        AprGrupoOpcaoRespostaRelacao: true,
      },
    },
  });

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createAprGrupoPergunta,
    updateAction: updateAprGrupoPergunta,
    onSuccess: () => grupos.mutate(),
    successMessage: 'Grupo salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<AprGrupoPergunta>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<AprGrupoPergunta>('nome', 'nome do grupo'),
      },
      {
        title: 'Tipo de Resposta',
        dataIndex: 'tipoResposta',
        key: 'tipoResposta',
        sorter: true,
        render: (tipo: string) => {
          if (tipo === 'opcao') {
            return <Tag color='green'>Opção</Tag>;
          }
          if (tipo === 'texto') {
            return <Tag color='geekblue'>Texto</Tag>;
          }
          return <Tag color='gold'>Checkbox</Tag>;
        },
      },
      {
        title: 'Perguntas',
        key: 'perguntas',
        width: 110,
        align: 'center' as const,
        render: (_, record: AprGrupoPergunta & { AprGrupoPerguntaRelacao?: unknown[] }) =>
          record.AprGrupoPerguntaRelacao?.length || 0,
      },
      {
        title: 'Opções',
        key: 'opcoes',
        width: 110,
        align: 'center' as const,
        render: (_, record: AprGrupoPergunta & { AprGrupoOpcaoRespostaRelacao?: unknown[] }) =>
          record.AprGrupoOpcaoRespostaRelacao?.length || 0,
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteAprGrupoPergunta({ id: item.id }),
            'Grupo excluído com sucesso!'
          )
          .finally(() => grupos.mutate()),
    }
  );

  return (
    <CrudPage
      title='Grupos de Perguntas APR'
      entityKey='apr-grupos-pergunta'
      controller={controller}
      entityData={grupos}
      columns={columns}
      formComponent={AprGrupoPerguntaForm}
      onSubmit={handleSubmit}
      modalWidth={900}
    />
  );
}

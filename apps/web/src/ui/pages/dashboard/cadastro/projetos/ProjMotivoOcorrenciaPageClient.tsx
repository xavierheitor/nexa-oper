'use client';

import type {
  ProjMotivoOcorrencia,
  ProjTipoMotivoOcorrencia,
} from '@nexa-oper/db';
import { Tag } from 'antd';
import { createProjMotivoOcorrencia } from '@/lib/actions/projMotivoOcorrencia/create';
import { deleteProjMotivoOcorrencia } from '@/lib/actions/projMotivoOcorrencia/delete';
import { listProjMotivosOcorrencia } from '@/lib/actions/projMotivoOcorrencia/list';
import { updateProjMotivoOcorrencia } from '@/lib/actions/projMotivoOcorrencia/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import TableExternalFilters from '@/ui/components/TableExternalFilters';
import { getTextFilter } from '@/ui/components/tableFilters';
import ProjMotivoOcorrenciaForm from './ProjMotivoOcorrenciaForm';

interface Props {
  initialData?: PaginatedResult<ProjMotivoOcorrencia>;
}

const TIPO_LABEL: Record<ProjTipoMotivoOcorrencia, string> = {
  CANCELAMENTO_PROGRAMACAO: 'Cancelamento de Programação',
  NAO_EXECUCAO_ITEM: 'Não Execução de Item',
};

export default function ProjMotivoOcorrenciaPageClient({ initialData }: Props) {
  const controller = useCrudController<ProjMotivoOcorrencia>(
    'proj-motivos-ocorrencia'
  );

  const motivos = useEntityData<ProjMotivoOcorrencia>({
    key: 'proj-motivos-ocorrencia',
    fetcherAction: unwrapPaginatedFetcher(listProjMotivosOcorrencia),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  });

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createProjMotivoOcorrencia,
    updateAction: updateProjMotivoOcorrencia,
    onSuccess: () => motivos.mutate(),
    successMessage: 'Motivo salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<ProjMotivoOcorrencia>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Código',
        dataIndex: 'codigo',
        key: 'codigo',
        sorter: true,
        ...getTextFilter<ProjMotivoOcorrencia>('codigo', 'código'),
      },
      {
        title: 'Descrição',
        dataIndex: 'descricao',
        key: 'descricao',
        sorter: true,
        ...getTextFilter<ProjMotivoOcorrencia>('descricao', 'descrição'),
      },
      {
        title: 'Tipo',
        dataIndex: 'tipo',
        key: 'tipo',
        render: (tipo: ProjTipoMotivoOcorrencia) => TIPO_LABEL[tipo],
      },
      {
        title: 'Ativo',
        dataIndex: 'ativo',
        key: 'ativo',
        render: (ativo: boolean) =>
          ativo ? <Tag color='green'>Sim</Tag> : <Tag color='red'>Não</Tag>,
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteProjMotivoOcorrencia({ id: item.id }),
            'Motivo excluído com sucesso!'
          )
          .finally(() => motivos.mutate()),
    }
  );

  return (
    <CrudPage
      title='Motivos de Ocorrência'
      entityKey='proj-motivos-ocorrencia'
      controller={controller}
      entityData={motivos}
      columns={columns}
      formComponent={ProjMotivoOcorrenciaForm}
      onSubmit={handleSubmit}
      modalWidth={600}
      tableHeaderContent={
        <TableExternalFilters
          filters={[
            {
              label: 'Tipo',
              placeholder: 'Filtrar por tipo',
              options: Object.entries(TIPO_LABEL).map(([value, label]) => ({
                value,
                label,
              })),
              onChange: (tipo) =>
                motivos.setParams((prev) => ({
                  ...prev,
                  tipo: tipo ? (tipo as ProjTipoMotivoOcorrencia) : undefined,
                  page: 1,
                })),
            },
            {
              label: 'Ativo',
              placeholder: 'Filtrar por status',
              options: [
                { value: 'true', label: 'Ativo' },
                { value: 'false', label: 'Inativo' },
              ],
              onChange: (ativo) =>
                motivos.setParams((prev) => ({
                  ...prev,
                  ativo:
                    ativo === 'true' ? true : ativo === 'false' ? false : undefined,
                  page: 1,
                })),
            },
          ]}
        />
      }
    />
  );
}

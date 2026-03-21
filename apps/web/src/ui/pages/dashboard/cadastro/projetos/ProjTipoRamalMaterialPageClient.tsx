'use client';

import type {
  Contrato,
  MaterialCatalogo,
  ProjTipoRamal,
} from '@nexa-oper/db';
import { Tag } from 'antd';
import { listContratosLookup } from '@/lib/actions/contrato/listLookup';
import { listMateriaisCatalogoLookup } from '@/lib/actions/materialCatalogo/listLookup';
import { createProjTipoRamalMaterial } from '@/lib/actions/projTipoRamalMaterial/create';
import { deleteProjTipoRamalMaterial } from '@/lib/actions/projTipoRamalMaterial/delete';
import { listProjTiposRamalMaterial } from '@/lib/actions/projTipoRamalMaterial/list';
import { updateProjTipoRamalMaterial } from '@/lib/actions/projTipoRamalMaterial/update';
import { listProjTiposRamal } from '@/lib/actions/projTipoRamal/list';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { ActionResult, PaginatedResult } from '@/lib/types/common';
import TableExternalFilters from '@/ui/components/TableExternalFilters';
import type { ProjTipoRamalMaterialRow } from '@/lib/repositories/projetos/ProjTipoRamalMaterialRepository';
import ProjTipoRamalMaterialForm, {
  type ProjTipoRamalMaterialFormData,
} from './ProjTipoRamalMaterialForm';

type ContratoOption = Pick<Contrato, 'id' | 'nome' | 'numero'>;
type TipoRamalOption = Pick<ProjTipoRamal, 'id' | 'nome'>;
type MaterialOption = Pick<MaterialCatalogo, 'id' | 'codigo' | 'descricao'>;

type ProjTipoRamalMaterialTableRow = ProjTipoRamalMaterialRow & {
  contrato?: ContratoOption | null;
  tipoRamal?: TipoRamalOption | null;
  material?: MaterialOption | null;
};

export interface ProjTipoRamalMaterialPageClientProps {
  initialData?: PaginatedResult<ProjTipoRamalMaterialTableRow>;
  initialContratos?: ContratoOption[];
  initialTiposRamal?: TipoRamalOption[];
  initialMateriais?: MaterialOption[];
  title?: string;
}

export default function ProjTipoRamalMaterialPageClient({
  initialData,
  initialContratos = [],
  initialTiposRamal = [],
  initialMateriais = [],
  title = 'Materiais por Ramal',
}: ProjTipoRamalMaterialPageClientProps) {
  const controller = useCrudController<ProjTipoRamalMaterialTableRow>(
    'proj-tipos-ramal-material'
  );

  const composicoes = useEntityData<ProjTipoRamalMaterialTableRow>({
    key: 'proj-tipos-ramal-material',
    fetcherAction: unwrapPaginatedFetcher(listProjTiposRamalMaterial),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        contrato: true,
        tipoRamal: true,
        material: true,
      },
    },
  });

  const contratos = useEntityData<ContratoOption>({
    key: 'proj-ramal-material-contratos',
    fetcherAction: unwrapFetcher(listContratosLookup),
    paginationEnabled: false,
    initialData: initialContratos,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const tiposRamal = useEntityData<TipoRamalOption>({
    key: 'proj-ramal-material-tipos-ramal',
    fetcherAction: unwrapFetcher(listProjTiposRamal),
    paginationEnabled: false,
    initialData: initialTiposRamal,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const materiais = useEntityData<MaterialOption>({
    key: 'proj-ramal-material-materiais',
    fetcherAction: unwrapFetcher(listMateriaisCatalogoLookup),
    paginationEnabled: false,
    initialData: initialMateriais,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'descricao',
      orderDir: 'asc',
    },
  });

  const columns = useTableColumnsWithActions<ProjTipoRamalMaterialTableRow>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Contrato',
        dataIndex: ['contrato', 'nome'],
        key: 'contrato',
        render: (_: unknown, record) =>
          record.contrato
            ? record.contrato.numero
              ? `${record.contrato.nome} (${record.contrato.numero})`
              : record.contrato.nome
            : '-',
      },
      {
        title: 'Tipo de Ramal',
        dataIndex: ['tipoRamal', 'nome'],
        key: 'tipoRamal',
      },
      {
        title: 'Material',
        dataIndex: ['material', 'descricao'],
        key: 'material',
        render: (_: unknown, record) =>
          record.material
            ? `${record.material.codigo} - ${record.material.descricao}`
            : '-',
      },
      {
        title: 'Qtd. Base',
        dataIndex: 'quantidadeBase',
        key: 'quantidadeBase',
        render: (value: number) => value.toLocaleString('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 4,
        }),
      },
      {
        title: 'Consumo',
        dataIndex: 'tipoConsumo',
        key: 'tipoConsumo',
        render: (tipoConsumo: string) => (
          <Tag color={tipoConsumo === 'FIXO' ? 'blue' : 'gold'}>
            {tipoConsumo === 'FIXO' ? 'Fixo' : 'Variável'}
          </Tag>
        ),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteProjTipoRamalMaterial({ id: item.id }),
            'Composição excluída com sucesso!'
          )
          .finally(() => composicoes.mutate()),
    }
  );

  const handleSubmit = async (values: ProjTipoRamalMaterialFormData) => {
    const payload = {
      ...values,
      contratoId: Number(values.contratoId),
      tipoRamalId: Number(values.tipoRamalId),
      materialId: Number(values.materialId),
      quantidadeBase: Number(values.quantidadeBase),
    };

    const action = async (): Promise<ActionResult<ProjTipoRamalMaterialRow>> => {
      if (controller.editingItem?.id) {
        return updateProjTipoRamalMaterial({
          ...payload,
          id: controller.editingItem.id,
        });
      }

      return createProjTipoRamalMaterial(payload);
    };

    controller.exec(action, 'Composição salva com sucesso!').finally(() => {
      composicoes.mutate();
    });
  };

  return (
    <CrudPage
      title={title}
      entityKey='proj-tipos-ramal-material'
      controller={controller}
      entityData={composicoes}
      columns={columns}
      formComponent={(props) => (
        <ProjTipoRamalMaterialForm
          {...props}
          contratos={contratos.data || []}
          tiposRamal={tiposRamal.data || []}
          materiais={materiais.data || []}
        />
      )}
      onSubmit={handleSubmit}
      modalWidth={700}
      tableHeaderContent={
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
                composicoes.setParams((prev) => ({
                  ...prev,
                  contratoId: contratoId ? Number(contratoId) : undefined,
                  page: 1,
                })),
              loading: contratos.isLoading,
            },
            {
              label: 'Tipo de Ramal',
              placeholder: 'Filtrar por tipo de ramal',
              options:
                tiposRamal.data?.map((tipo) => ({
                  label: tipo.nome,
                  value: tipo.id,
                })) || [],
              onChange: (tipoRamalId) =>
                composicoes.setParams((prev) => ({
                  ...prev,
                  tipoRamalId: tipoRamalId ? Number(tipoRamalId) : undefined,
                  page: 1,
                })),
              loading: tiposRamal.isLoading,
            },
          ]}
        />
      }
    />
  );
}

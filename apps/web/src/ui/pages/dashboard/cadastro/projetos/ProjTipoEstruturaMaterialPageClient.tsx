'use client';

import type { MaterialCatalogo, ProjTipoEstrutura } from '@nexa-oper/db';
import { Tag } from 'antd';
import { listMateriaisCatalogoLookup } from '@/lib/actions/materialCatalogo/listLookup';
import { createManyProjTipoEstruturaMaterial } from '@/lib/actions/projTipoEstruturaMaterial/createMany';
import { createProjTipoEstruturaMaterial } from '@/lib/actions/projTipoEstruturaMaterial/create';
import { deleteProjTipoEstruturaMaterial } from '@/lib/actions/projTipoEstruturaMaterial/delete';
import { listProjTiposEstruturaMaterial } from '@/lib/actions/projTipoEstruturaMaterial/list';
import { updateProjTipoEstruturaMaterial } from '@/lib/actions/projTipoEstruturaMaterial/update';
import { listProjTiposEstrutura } from '@/lib/actions/projTipoEstrutura/list';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { ActionResult, PaginatedResult } from '@/lib/types/common';
import TableExternalFilters from '@/ui/components/TableExternalFilters';
import type { ProjTipoEstruturaMaterialRow } from '@/lib/repositories/projetos/ProjTipoEstruturaMaterialRepository';
import ProjTipoEstruturaMaterialForm, {
  type ProjTipoEstruturaMaterialFormData,
} from './ProjTipoEstruturaMaterialForm';

type TipoEstruturaOption = Pick<ProjTipoEstrutura, 'id' | 'nome'>;
type MaterialOption = Pick<MaterialCatalogo, 'id' | 'codigo' | 'descricao'>;

export type ProjTipoEstruturaMaterialTableRow = ProjTipoEstruturaMaterialRow & {
  tipoEstrutura?: TipoEstruturaOption | null;
  material?: MaterialOption | null;
};

const VARIAVEL_FALLBACK_QUANTIDADE_BASE = 0.0001;

const normalizeQuantidadeBase = (
  item: Pick<
    ProjTipoEstruturaMaterialFormData['itens'][number],
    'quantidadeBase' | 'tipoConsumo'
  >
) =>
  item.tipoConsumo === 'VARIAVEL'
    ? Number(item.quantidadeBase ?? VARIAVEL_FALLBACK_QUANTIDADE_BASE)
    : Number(item.quantidadeBase);

export interface ProjTipoEstruturaMaterialPageClientProps {
  initialData?: PaginatedResult<ProjTipoEstruturaMaterialTableRow>;
  initialTiposEstrutura?: TipoEstruturaOption[];
  initialMateriais?: MaterialOption[];
  title?: string;
}

export default function ProjTipoEstruturaMaterialPageClient({
  initialData,
  initialTiposEstrutura = [],
  initialMateriais = [],
  title = 'Materiais por Estrutura',
}: ProjTipoEstruturaMaterialPageClientProps) {
  const controller = useCrudController<ProjTipoEstruturaMaterialTableRow>(
    'proj-tipos-estrutura-material'
  );

  const composicoes = useEntityData<ProjTipoEstruturaMaterialTableRow>({
    key: 'proj-tipos-estrutura-material',
    fetcherAction: unwrapPaginatedFetcher(listProjTiposEstruturaMaterial),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        tipoEstrutura: true,
        material: true,
      },
    },
  });

  const tiposEstrutura = useEntityData<TipoEstruturaOption>({
    key: 'proj-estrutura-material-tipos-estrutura',
    fetcherAction: unwrapFetcher(listProjTiposEstrutura),
    paginationEnabled: false,
    initialData: initialTiposEstrutura,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const materiais = useEntityData<MaterialOption>({
    key: 'proj-estrutura-material-materiais',
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

  const columns = useTableColumnsWithActions<ProjTipoEstruturaMaterialTableRow>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Estrutura',
        dataIndex: ['tipoEstrutura', 'nome'],
        key: 'tipoEstrutura',
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
        render: (value: number, record) =>
          record.tipoConsumo === 'VARIAVEL'
            ? '-'
            : value.toLocaleString('pt-BR', {
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
            () => deleteProjTipoEstruturaMaterial({ id: item.id }),
            'Composição excluída com sucesso!'
          )
          .finally(() => composicoes.mutate()),
    }
  );

  const handleSubmit = async (values: ProjTipoEstruturaMaterialFormData) => {
    const action = async (): Promise<ActionResult> => {
      if (controller.editingItem?.id) {
        const item = values.itens[0];

        return updateProjTipoEstruturaMaterial({
          tipoEstruturaId: Number(values.tipoEstruturaId),
          materialId: Number(item.materialId),
          quantidadeBase: normalizeQuantidadeBase(item),
          tipoConsumo: item.tipoConsumo!,
          id: controller.editingItem.id,
        });
      }

      if (values.itens.length === 1) {
        const item = values.itens[0];

        return createProjTipoEstruturaMaterial({
          tipoEstruturaId: Number(values.tipoEstruturaId),
          materialId: Number(item.materialId),
          quantidadeBase: normalizeQuantidadeBase(item),
          tipoConsumo: item.tipoConsumo!,
        });
      }

      return createManyProjTipoEstruturaMaterial({
        tipoEstruturaId: Number(values.tipoEstruturaId),
        itens: values.itens.map((item) => ({
          materialId: Number(item.materialId),
          quantidadeBase: normalizeQuantidadeBase(item),
          tipoConsumo: item.tipoConsumo!,
        })),
      });
    };

    const successMessage = controller.editingItem?.id
      ? 'Composição salva com sucesso!'
      : values.itens.length === 1
        ? 'Material adicionado com sucesso!'
        : `${values.itens.length} materiais adicionados com sucesso!`;

    await controller.exec(action, successMessage);
    await composicoes.mutate();
  };

  return (
    <CrudPage
      title={title}
      entityKey='proj-tipos-estrutura-material'
      controller={controller}
      entityData={composicoes}
      columns={columns}
      formComponent={(props) => (
        <ProjTipoEstruturaMaterialForm
          {...props}
          tiposEstrutura={tiposEstrutura.data ?? []}
          materiais={materiais.data ?? []}
        />
      )}
      onSubmit={handleSubmit}
      modalWidth={700}
      tableHeaderContent={
        <TableExternalFilters
          filters={[
            {
              label: 'Estrutura',
              placeholder: 'Filtrar por estrutura',
              options:
                tiposEstrutura.data?.map((tipo) => ({
                  label: tipo.nome,
                  value: tipo.id,
                })) ?? [],
              onChange: (tipoEstruturaId) =>
                composicoes.setParams((prev) => ({
                  ...prev,
                  tipoEstruturaId: tipoEstruturaId
                    ? Number(tipoEstruturaId)
                    : undefined,
                  page: 1,
                })),
              loading: tiposEstrutura.isLoading,
            },
          ]}
        />
      }
    />
  );
}

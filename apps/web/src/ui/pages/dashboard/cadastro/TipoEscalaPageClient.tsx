'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Tag } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import {
  listTiposEscala,
  createTipoEscala,
  updateTipoEscala,
  deleteTipoEscala,
} from '@/lib/actions/escala/tipoEscala';
import CrudPage from '@/lib/components/CrudPage';
import TipoEscalaForm from '@/app/dashboard/cadastro/tipo-escala/form';

export interface TipoEscala {
  id: number;
  nome: string;
  modoRepeticao: 'CICLO_DIAS' | 'SEMANA_DEPENDENTE';
  cicloDias?: number | null;
  periodicidadeSemanas?: number | null;
  eletricistasPorTurma?: number | null;
  ativo: boolean;
  observacoes?: string | null;
  _count?: {
    CicloPosicoes: number;
    SemanaMascaras: number;
  };
}

interface TipoEscalaPageClientProps {
  initialData?: PaginatedResult<TipoEscala>;
}

export default function TipoEscalaPageClient({
  initialData,
}: TipoEscalaPageClientProps) {
  const router = useRouter();
  const controller = useCrudController<TipoEscala>('tipoEscala');

  const tipos = useEntityData<TipoEscala>({
    key: 'tiposEscala',
    fetcherAction: unwrapFetcher(listTiposEscala) as any,
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const handleSubmit = useCrudFormHandler<any, TipoEscala>({
    controller: controller as any, // Type cast needed due to ActionResult generic mismatch
    createAction: createTipoEscala as any,
    updateAction: updateTipoEscala as any,
    onSuccess: () => tipos.mutate(),
    successMessage: 'Tipo de escala salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<TipoEscala>(
    [
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<TipoEscala>('nome', 'nome do tipo'),
      },
      {
        title: 'Modo',
        dataIndex: 'modoRepeticao',
        key: 'modoRepeticao',
        width: 180,
        render: (modo: string) => (
          <Tag color={modo === 'CICLO_DIAS' ? 'blue' : 'purple'}>
            {modo === 'CICLO_DIAS' ? 'Ciclo de Dias' : 'Semana Dependente'}
          </Tag>
        ),
      },
      {
        title: 'Ciclo/Semanas',
        key: 'config',
        width: 150,
        render: (_: unknown, record: TipoEscala) => {
          if (record.modoRepeticao === 'CICLO_DIAS') {
            return `${record.cicloDias} dias`;
          }
          return `${record.periodicidadeSemanas} semanas`;
        },
      },
      {
        title: 'Eletricistas/Turma',
        dataIndex: 'eletricistasPorTurma',
        key: 'eletricistasPorTurma',
        width: 150,
        render: (qtd?: number) => qtd || '-',
      },
      {
        title: 'Posições',
        key: 'posicoes',
        width: 120,
        render: (_: unknown, record: TipoEscala) => {
          const count = record.modoRepeticao === 'CICLO_DIAS'
            ? record._count?.CicloPosicoes || 0
            : record._count?.SemanaMascaras || 0;
          return <Badge count={count} showZero color="blue" />;
        },
      },
      {
        title: 'Ativo',
        dataIndex: 'ativo',
        key: 'ativo',
        width: 100,
        render: (ativo: boolean) => (
          <Tag color={ativo ? 'green' : 'red'}>
            {ativo ? 'Ativo' : 'Inativo'}
          </Tag>
        ),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteTipoEscala(item.id),
            'Tipo de escala excluído com sucesso!'
          )
          .finally(() => tipos.mutate()),
      customActions: [
        {
          key: 'config',
          label: 'Configurar',
          icon: <SettingOutlined />,
          type: 'link',
          onClick: (item) => router.push(`/dashboard/cadastro/tipo-escala/${item.id}`),
        },
      ],
    }
  );

  return (
    <CrudPage
      title="Tipos de Escala"
      entityKey="tiposEscala"
      controller={controller}
      entityData={tipos}
      columns={columns}
      formComponent={TipoEscalaForm}
      onSubmit={handleSubmit}
      modalWidth={700}
      addButtonText="Novo Tipo"
    />
  );
}

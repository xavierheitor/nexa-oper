'use client';

import {
  listHorarioAberturaCatalogo,
  createHorarioAberturaCatalogo,
  updateHorarioAberturaCatalogo,
  deleteHorarioAberturaCatalogo,
} from '@/lib/actions/escala/horarioAberturaCatalogo';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { getTextFilter } from '@/ui/components/tableFilters';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Space, Tag } from 'antd';
import HorarioAberturaCatalogoForm from './form';

interface HorarioAberturaCatalogo {
  id: number;
  nome: string;
  inicioTurnoHora: string;
  duracaoHoras: number;
  duracaoIntervaloHoras: number;
  ativo: boolean;
  observacoes?: string;
  _count?: {
    Historicos: number;
  };
}

export default function HorarioCatalogoPage() {
  const controller = useCrudController<HorarioAberturaCatalogo>('horarioAberturaCatalogo');

  const horarios = useEntityData<HorarioAberturaCatalogo>({
    key: 'horarioAberturaCatalogo',
    fetcherAction: unwrapFetcher(listHorarioAberturaCatalogo) as any,
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const handleSubmit = useCrudFormHandler<any, HorarioAberturaCatalogo>({
    controller: controller as any, // Type cast needed due to ActionResult generic mismatch
    createAction: createHorarioAberturaCatalogo as any,
    updateAction: updateHorarioAberturaCatalogo as any,
    onSuccess: () => horarios.mutate(),
    successMessage: 'Horário salvo com sucesso!',
  });

  const calcularHorarioFim = (inicio: string, duracao: number, intervalo: number = 0): string => {
    const [horas, minutos] = inicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + (duracao + intervalo) * 60;
    const horasFim = Math.floor(totalMinutos / 60) % 24;
    const minutosFim = totalMinutos % 60;
    return `${String(horasFim).padStart(2, '0')}:${String(minutosFim).padStart(2, '0')}`;
  };

  const columns = useTableColumnsWithActions<HorarioAberturaCatalogo>(
    [
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<HorarioAberturaCatalogo>('nome', 'nome do horário'),
      },
      {
        title: 'Horário',
        key: 'horario',
        width: 250,
        render: (_: unknown, record: HorarioAberturaCatalogo) => {
          const fim = calcularHorarioFim(
            record.inicioTurnoHora,
            Number(record.duracaoHoras),
            Number(record.duracaoIntervaloHoras)
          );
          const intervalo = Number(record.duracaoIntervaloHoras) > 0
            ? ` + ${record.duracaoIntervaloHoras}h int.`
            : '';
          return (
            <Space>
              <ClockCircleOutlined />
              <span>
                {record.inicioTurnoHora.substring(0, 5)} às {fim} ({record.duracaoHoras}h{intervalo})
              </span>
            </Space>
          );
        },
      },
      {
        title: 'Status',
        dataIndex: 'ativo',
        key: 'ativo',
        width: 100,
        render: (ativo: boolean) => (
          <Tag color={ativo ? 'green' : 'default'}>
            {ativo ? 'Ativo' : 'Inativo'}
          </Tag>
        ),
      },
      {
        title: 'Equipes Usando',
        key: 'uso',
        width: 120,
        render: (_: unknown, record: HorarioAberturaCatalogo) => (
          <Tag color="blue">
            {record._count?.Historicos || 0} equipe(s)
          </Tag>
        ),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteHorarioAberturaCatalogo(item.id),
            'Horário excluído com sucesso!'
          )
          .finally(() => horarios.mutate()),
    }
  );

  return (
    <CrudPage
      title="Catálogo de Horários"
      entityKey="horarioAberturaCatalogo"
      controller={controller}
      entityData={horarios}
      columns={columns}
      formComponent={HorarioAberturaCatalogoForm}
      onSubmit={handleSubmit}
      modalWidth={600}
      addButtonText="Novo Horário"
    />
  );
}

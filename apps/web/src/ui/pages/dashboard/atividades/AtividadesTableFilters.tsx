'use client';

import type { AtividadesFilterFieldMap } from '@/lib/types/atividadeDashboard';
import TableExternalFilters from '@/ui/components/TableExternalFilters';
import { DatePicker, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { useAtividadesFilterOptions } from './useAtividadesFilterOptions';

const { Text } = Typography;

interface AtividadesTableFiltersProps {
  onFilterChange: (
    field: keyof AtividadesFilterFieldMap,
    value?: number | Date
  ) => void;
}

export default function AtividadesTableFilters({
  onFilterChange,
}: AtividadesTableFiltersProps) {
  const {
    tiposAtividade,
    tiposAtividadeServico,
    equipes,
    veiculos,
    eletricistas,
  } = useAtividadesFilterOptions();

  return (
    <div style={{ marginBottom: 16 }}>
      <TableExternalFilters
        filters={[
          {
            label: 'Tipo de Atividade',
            placeholder: 'Filtrar por tipo de atividade',
            options:
              tiposAtividade.data?.map((tipo) => ({
                label: tipo.nome,
                value: tipo.id,
              })) || [],
            onChange: (value) =>
              onFilterChange(
                'tipoAtividadeId',
                value ? Number(value) : undefined
              ),
            loading: tiposAtividade.isLoading,
          },
          {
            label: 'Subtipo de Atividade',
            placeholder: 'Filtrar por subtipo',
            options:
              tiposAtividadeServico.data?.map((subtipo) => ({
                label: subtipo.atividadeTipo?.nome
                  ? `${subtipo.nome} (${subtipo.atividadeTipo.nome})`
                  : subtipo.nome,
                value: subtipo.id,
              })) || [],
            onChange: (value) =>
              onFilterChange(
                'tipoAtividadeServicoId',
                value ? Number(value) : undefined
              ),
            loading: tiposAtividadeServico.isLoading,
          },
          {
            label: 'Equipe',
            placeholder: 'Buscar por equipe',
            options:
              equipes.data?.map((equipe) => ({
                label: equipe.nome,
                value: equipe.id,
              })) || [],
            onChange: (value) =>
              onFilterChange('equipeId', value ? Number(value) : undefined),
            loading: equipes.isLoading,
          },
          {
            label: 'Veículo',
            placeholder: 'Buscar por placa',
            options:
              veiculos.data?.map((veiculo) => ({
                label: veiculo.modelo
                  ? `${veiculo.placa} (${veiculo.modelo})`
                  : veiculo.placa,
                value: veiculo.id,
              })) || [],
            onChange: (value) =>
              onFilterChange('veiculoId', value ? Number(value) : undefined),
            loading: veiculos.isLoading,
          },
          {
            label: 'Eletricista',
            placeholder: 'Filtrar por eletricista',
            options:
              eletricistas.data?.map((eletricista) => ({
                label: eletricista.matricula
                  ? `${eletricista.nome} (${eletricista.matricula})`
                  : eletricista.nome,
                value: eletricista.id,
              })) || [],
            onChange: (value) =>
              onFilterChange(
                'eletricistaId',
                value ? Number(value) : undefined
              ),
            loading: eletricistas.isLoading,
          },
        ]}
      />

      <Space size='middle'>
        <Text type='secondary'>Dia do turno:</Text>
        <DatePicker
          allowClear
          format='DD/MM/YYYY'
          onChange={(date) =>
            onFilterChange('turnoDia', date ? dayjs(date).toDate() : undefined)
          }
        />
      </Space>
    </div>
  );
}

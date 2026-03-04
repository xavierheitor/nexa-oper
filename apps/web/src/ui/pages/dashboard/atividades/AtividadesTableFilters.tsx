'use client';

import type { AtividadesFilterFieldMap } from '@/lib/types/atividadeDashboard';
import TableExternalFilters from '@/ui/components/TableExternalFilters';
import { DatePicker, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useAtividadesFilterOptions } from './useAtividadesFilterOptions';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface AtividadesTableFiltersProps {
  onFilterChange: (
    field: keyof AtividadesFilterFieldMap,
    value?: number | Date | boolean | string
  ) => void;
  onFilterBatchChange?: (values: Partial<AtividadesFilterFieldMap>) => void;
  defaultRange?: [Dayjs, Dayjs];
}

export default function AtividadesTableFilters({
  onFilterChange,
  onFilterBatchChange,
  defaultRange,
}: AtividadesTableFiltersProps) {
  const {
    tiposAtividade,
    tiposAtividadeServico,
    equipes,
    veiculos,
    eletricistas,
    causasImprodutivas,
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
            label: 'Produtividade',
            placeholder: 'Filtrar por produtividade',
            options: [
              { label: 'Produtiva', value: 'produtiva' },
              { label: 'Improdutiva', value: 'improdutiva' },
            ],
            onChange: (value) => {
              if (value === 'produtiva') {
                onFilterChange('atividadeProdutiva', true);
                return;
              }

              if (value === 'improdutiva') {
                onFilterChange('atividadeProdutiva', false);
                return;
              }

              onFilterChange('atividadeProdutiva', undefined);
            },
          },
          {
            label: 'Causa Improdutiva',
            placeholder: 'Filtrar por causa',
            options:
              causasImprodutivas.data
                ?.filter(causa => causa.ativo)
                .map(causa => ({
                  label: causa.causa,
                  value: causa.causa,
                })) || [],
            onChange: value =>
              onFilterChange(
                'causaImprodutiva',
                value ? String(value) : undefined
              ),
            loading: causasImprodutivas.isLoading,
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
        <Text type='secondary'>Período do turno:</Text>
        <RangePicker
          allowClear
          format='DD/MM/YYYY'
          defaultValue={defaultRange}
          onChange={(range) => {
            const dataInicio = range?.[0] ? dayjs(range[0]).toDate() : undefined;
            const dataFim = range?.[1] ? dayjs(range[1]).toDate() : undefined;

            if (onFilterBatchChange) {
              onFilterBatchChange({ dataInicio, dataFim });
              return;
            }

            onFilterChange('dataInicio', dataInicio);
            onFilterChange('dataFim', dataFim);
          }}
        />
      </Space>

      <Space size='middle' style={{ marginTop: 8 }}>
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

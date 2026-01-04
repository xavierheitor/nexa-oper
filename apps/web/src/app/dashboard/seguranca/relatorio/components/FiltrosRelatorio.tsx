'use client';

import { DatePicker, Select, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { Base, TipoEquipe } from '@nexa-oper/db';

const { RangePicker } = DatePicker;

interface FiltrosRelatorioProps {
  periodo: [Dayjs, Dayjs];
  baseId?: number;
  tipoEquipeId?: number;
  bases?: Base[] | null;
  tiposEquipe?: TipoEquipe[] | null;
  loadingBases?: boolean;
  loadingTiposEquipe?: boolean;
  onPeriodoChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  onBaseChange: (baseId: number | undefined) => void;
  onTipoEquipeChange: (tipoEquipeId: number | undefined) => void;
}

/**
 * Componente de Filtros do Relatório de Segurança
 *
 * Exibe filtros para:
 * - Seleção de Base
 * - Seleção de Tipo de Equipe
 * - Seleção de Período (RangePicker)
 */
export function FiltrosRelatorio({
  periodo,
  baseId,
  tipoEquipeId,
  bases = [],
  tiposEquipe = [],
  loadingBases = false,
  loadingTiposEquipe = false,
  onPeriodoChange,
  onBaseChange,
  onTipoEquipeChange,
}: FiltrosRelatorioProps) {
  const basesList = bases ?? [];
  const tiposEquipeList = tiposEquipe ?? [];

  return (
    <Space>
      <Select
        placeholder="Todas as bases"
        allowClear
        style={{ width: 200 }}
        value={baseId}
        onChange={onBaseChange}
        showSearch
        loading={loadingBases}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={basesList.map((base: Base) => ({
          value: base.id,
          label: base.nome,
        }))}
      />
      <Select
        placeholder="Todos os tipos de equipe"
        allowClear
        style={{ width: 200 }}
        value={tipoEquipeId}
        onChange={onTipoEquipeChange}
        showSearch
        loading={loadingTiposEquipe}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={tiposEquipeList.map((tipo: TipoEquipe) => ({
          value: tipo.id,
          label: tipo.nome,
        }))}
      />
      <RangePicker
        value={periodo}
        onChange={onPeriodoChange}
        format="DD/MM/YYYY"
        allowClear={false}
      />
    </Space>
  );
}


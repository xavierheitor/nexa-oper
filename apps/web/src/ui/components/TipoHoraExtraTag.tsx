'use client';

import { Tag } from 'antd';
import {
  HoraExtraTipo,
  HoraExtraTipoLabels,
} from '@/lib/schemas/turnoRealizadoSchema';

interface TipoHoraExtraTagProps {
  tipo: HoraExtraTipo | string;
}

/**
 * Componente para exibir tipo de hora extra
 */
export default function TipoHoraExtraTag({ tipo }: TipoHoraExtraTagProps) {
  const label = HoraExtraTipoLabels[tipo as HoraExtraTipo] || tipo;

  // Cores por tipo
  const colorMap: Record<string, string> = {
    folga_trabalhada: 'purple',
    extrafora: 'blue',
    atraso_compensado: 'orange',
    troca_folga: 'cyan',
  };

  return <Tag color={colorMap[tipo] || 'default'}>{label}</Tag>;
}


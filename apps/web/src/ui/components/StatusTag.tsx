'use client';

import { Tag } from 'antd';
import {
  FaltaStatus,
  FaltaStatusLabels,
  FaltaStatusColors,
  HoraExtraStatus,
  HoraExtraStatusLabels,
  HoraExtraStatusColors,
} from '@/lib/schemas/turnoRealizadoSchema';

interface StatusTagProps {
  status: FaltaStatus | HoraExtraStatus | string;
  tipo: 'falta' | 'horaExtra' | 'geral';
}

/**
 * Componente para exibir status com cores
 */
export default function StatusTag({ status, tipo }: StatusTagProps) {
  if (tipo === 'falta') {
    const faltaStatus = status as FaltaStatus;
    return (
      <Tag color={FaltaStatusColors[faltaStatus] || 'default'}>
        {FaltaStatusLabels[faltaStatus] || status}
      </Tag>
    );
  }

  if (tipo === 'horaExtra') {
    const horaExtraStatus = status as HoraExtraStatus;
    return (
      <Tag color={HoraExtraStatusColors[horaExtraStatus] || 'default'}>
        {HoraExtraStatusLabels[horaExtraStatus] || status}
      </Tag>
    );
  }

  // Geral - cores padrão
  const colorMap: Record<string, string> = {
    pendente: 'orange',
    aprovada: 'green',
    justificada: 'green',
    rejeitada: 'red',
    indeferida: 'red',
    normal: 'blue',
  };

  return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
}


'use client';

import { Card, Col, Row, Statistic, Spin } from 'antd';
import {
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useHydrated } from '@/lib/hooks/useHydrated';
import type { RecursosPorBase } from '@/lib/actions/turno/getRecursosPorBase';

interface DashboardStatsProps {
  turnosAbertos?: number;
  totalDiarios?: number;
  recursosPorBase?: RecursosPorBase[] | null;
  loading?: boolean;
}

/**
 * Componente de Estatísticas Principais do Dashboard
 *
 * Exibe 4 cards com:
 * - Turnos Abertos no Momento
 * - Turnos do Dia
 * - Total de Eletricistas
 * - Total de Veículos
 */
export function DashboardStats({
  turnosAbertos = 0,
  totalDiarios = 0,
  recursosPorBase,
  loading = false,
}: DashboardStatsProps) {
  // Check de hidratação
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Calcula totais de recursos
  const recursos = recursosPorBase ?? [];
  const totalEletricistas = recursos.reduce((acc, r) => acc + r.eletricistas, 0);
  const totalVeiculos = recursos.reduce((acc, r) => acc + r.veiculos, 0);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Turnos Abertos no Momento"
            value={turnosAbertos}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Turnos do Dia"
            value={totalDiarios}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#722ed1' }}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total de Eletricistas"
            value={totalEletricistas}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#52c41a' }}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total de Veículos"
            value={totalVeiculos}
            prefix={<CarOutlined />}
            valueStyle={{ color: '#fa8c16' }}
            loading={loading}
          />
        </Card>
      </Col>
    </Row>
  );
}


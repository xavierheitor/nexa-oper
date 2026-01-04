'use client';

import { Card, Col, Row, Statistic, Spin, Empty } from 'antd';
import { Typography } from 'antd';
import {
  ApartmentOutlined,
  UserOutlined,
  CarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { RecursosPorBase } from '@/lib/actions/turno/getRecursosPorBase';

const { Title } = Typography;

interface DashboardResourcesProps {
  recursosPorBase?: RecursosPorBase[] | null;
  loading?: boolean;
}

/**
 * Componente de Recursos por Base do Dashboard
 *
 * Exibe cards com estatísticas de recursos (eletricistas, veículos, equipes)
 * agrupados por base.
 */
export function DashboardResources({
  recursosPorBase,
  loading = false,
}: DashboardResourcesProps) {
  const recursos = recursosPorBase ?? [];

  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  if (!recursos || recursos.length === 0) {
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <Empty description="Nenhum dado disponível" />
          </Card>
        </Col>
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {recursos.map((recurso: RecursosPorBase) => (
        <Col xs={24} sm={12} md={8} lg={6} key={recurso.base}>
          <Card>
            <div style={{ marginBottom: 16 }}>
              <ApartmentOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
              <Title level={5} style={{ margin: 0 }}>
                {recurso.base}
              </Title>
            </div>
            <Row gutter={[8, 8]}>
              <Col xs={24}>
                <Statistic
                  title="Eletricistas"
                  value={recurso.eletricistas}
                  prefix={<UserOutlined />}
                  valueStyle={{ fontSize: 18 }}
                />
              </Col>
              <Col xs={24}>
                <Statistic
                  title="Veículos"
                  value={recurso.veiculos}
                  prefix={<CarOutlined />}
                  valueStyle={{ fontSize: 18 }}
                />
              </Col>
              <Col xs={24}>
                <Statistic
                  title="Equipes"
                  value={recurso.equipes}
                  prefix={<TeamOutlined />}
                  valueStyle={{ fontSize: 18 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

